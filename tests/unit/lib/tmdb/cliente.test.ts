import { describe, expect, it, vi } from "vitest";

import { criarClienteTmdb, TmdbErro } from "@/lib/tmdb/cliente";

const TOKEN = "token-super-secreto-123";

function resposta(status: number, corpo: unknown = {}, cabecalhos: Record<string, string> = {}) {
  return new Response(JSON.stringify(corpo), { status, headers: cabecalhos });
}

function montar(...respostas: (Response | Error)[]) {
  const fetchFalso = vi.fn(async () => {
    const proxima = respostas.shift();
    if (!proxima) throw new Error("sem resposta configurada");
    if (proxima instanceof Error) throw proxima;
    return proxima;
  });
  const esperar = vi.fn(async () => {});
  const cliente = criarClienteTmdb({
    token: TOKEN,
    baseUrl: "https://tmdb.falso/3",
    fetch: fetchFalso as unknown as typeof fetch,
    esperar,
  });
  return { cliente, fetchFalso, esperar };
}

describe("criarClienteTmdb", () => {
  it("monta a URL, envia o Bearer e o revalidate", async () => {
    const { cliente, fetchFalso } = montar(resposta(200, { ok: true }));

    await cliente.requisitar("/discover/movie", { page: 2, vazio: undefined }, 3600);

    const [url, init] = fetchFalso.mock.calls[0] as unknown as [
      string,
      RequestInit & {
        next: { revalidate: number };
      },
    ];
    expect(url).toBe("https://tmdb.falso/3/discover/movie?page=2&language=pt-BR");
    expect(new Headers(init.headers).get("Authorization")).toBe(`Bearer ${TOKEN}`);
    expect(init.next.revalidate).toBe(3600);
  });

  it("repete uma vez no 429 e devolve os dados", async () => {
    const { cliente, fetchFalso, esperar } = montar(
      resposta(429, {}, { "Retry-After": "2" }),
      resposta(200, { ok: true }),
    );

    expect(await cliente.requisitar("/x", {}, 60)).toEqual({ ok: true });
    expect(fetchFalso).toHaveBeenCalledTimes(2);
    expect(esperar).toHaveBeenCalledWith(2000);
  });

  it("limita o Retry-After a 5 segundos", async () => {
    const { cliente, esperar } = montar(
      resposta(429, {}, { "Retry-After": "60" }),
      resposta(200, {}),
    );
    await cliente.requisitar("/x", {}, 60);
    expect(esperar).toHaveBeenCalledWith(5000);
  });

  it("desiste depois de 2 novas tentativas em 5xx", async () => {
    const { cliente, fetchFalso, esperar } = montar(resposta(503), resposta(503), resposta(503));

    const erro = await cliente.requisitar("/x", {}, 60).catch((e: unknown) => e);
    expect(erro).toBeInstanceOf(TmdbErro);
    expect((erro as TmdbErro).status).toBe(503);
    expect(fetchFalso).toHaveBeenCalledTimes(3);
    expect(esperar.mock.calls).toEqual([[500], [1000]]);
  });

  it.each([400, 401, 403, 404])("não repete no %i", async (status) => {
    const { cliente, fetchFalso } = montar(resposta(status));
    const erro = await cliente.requisitar("/x", {}, 60).catch((e: unknown) => e);
    expect((erro as TmdbErro).status).toBe(status);
    expect(fetchFalso).toHaveBeenCalledTimes(1);
  });

  it("repete falha de rede e, persistindo, lança TmdbErro sem status", async () => {
    const { cliente, fetchFalso } = montar(
      new TypeError("fetch failed"),
      new TypeError("fetch failed"),
      new TypeError("fetch failed"),
    );
    const erro = await cliente.requisitar("/x", {}, 60).catch((e: unknown) => e);
    expect(erro).toBeInstanceOf(TmdbErro);
    expect((erro as TmdbErro).status).toBeNull();
    expect(fetchFalso).toHaveBeenCalledTimes(3);
  });

  it("aborta a tentativa no timeout e repete", async () => {
    const fetchLento = vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise<Response>((_resolver, rejeitar) => {
          init.signal?.addEventListener("abort", () => rejeitar(init.signal?.reason));
        }),
    );
    const cliente = criarClienteTmdb({
      token: TOKEN,
      baseUrl: "https://tmdb.falso/3",
      fetch: fetchLento as unknown as typeof fetch,
      esperar: async () => {},
      timeoutMs: 10,
    });

    const erro = await cliente.requisitar("/x", {}, 60).catch((e: unknown) => e);
    expect((erro as TmdbErro).status).toBeNull();
    expect(fetchLento).toHaveBeenCalledTimes(3);
  });

  it("nenhuma mensagem de erro contém o token", async () => {
    const { cliente } = montar(resposta(401, { status_message: `token ${TOKEN} inválido` }));
    const erro = (await cliente.requisitar("/x", {}, 60).catch((e: unknown) => e)) as Error;
    expect(erro.message).not.toContain(TOKEN);
    expect(String(erro.stack)).not.toContain(TOKEN);
  });
});
