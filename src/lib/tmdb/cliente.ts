import "server-only";

import { getServerEnv } from "@/lib/env.server";

export class TmdbErro extends Error {
  constructor(
    message: string,
    /** Status HTTP, ou `null` para timeout, falha de rede ou formato inesperado. */
    public readonly status: number | null,
  ) {
    super(message);
    this.name = "TmdbErro";
  }
}

export type Parametros = Record<string, string | number | boolean | undefined>;

export type ClienteTmdb = {
  requisitar(caminho: string, parametros: Parametros, revalidate: number): Promise<unknown>;
};

type Opcoes = {
  token: string;
  baseUrl: string;
  fetch?: typeof fetch;
  /** Espera entre tentativas; injetável para os testes não dormirem. */
  esperar?: (ms: number) => Promise<void>;
  timeoutMs?: number;
};

const NOVAS_TENTATIVAS = 2;
const ESPERAS_MS = [500, 1000];
const RETRY_AFTER_MAX_MS = 5000;

const dormir = (ms: number) => new Promise<void>((resolver) => setTimeout(resolver, ms));

function deveRepetir(status: number) {
  return status === 429 || status >= 500;
}

function esperaRetryAfter(resposta: Response, padrao: number) {
  const segundos = Number(resposta.headers.get("Retry-After"));
  return Number.isFinite(segundos) && segundos > 0
    ? Math.min(segundos * 1000, RETRY_AFTER_MAX_MS)
    : padrao;
}

export function criarClienteTmdb({
  token,
  baseUrl,
  fetch: fetchImpl = fetch,
  esperar = dormir,
  timeoutMs = 8000,
}: Opcoes): ClienteTmdb {
  async function requisitar(caminho: string, parametros: Parametros, revalidate: number) {
    const url = new URL(`${baseUrl.replace(/\/$/, "")}${caminho}`);
    for (const [chave, valor] of Object.entries({ ...parametros, language: "pt-BR" })) {
      if (valor !== undefined) url.searchParams.set(chave, String(valor));
    }

    let ultimoErro = new TmdbErro("Falha ao consultar o TMDB", null);

    for (let tentativa = 0; tentativa <= NOVAS_TENTATIVAS; tentativa++) {
      const esperaPadrao = ESPERAS_MS[tentativa] ?? ESPERAS_MS.at(-1)!;
      let resposta: Response;
      try {
        resposta = await fetchImpl(url.toString(), {
          headers: { Authorization: `Bearer ${token}`, accept: "application/json" },
          signal: AbortSignal.timeout(timeoutMs),
          next: { revalidate },
        });
      } catch {
        // Timeout ou falha de rede: a mensagem original pode conter a URL, então não é repassada.
        ultimoErro = new TmdbErro("Sem resposta do TMDB", null);
        if (tentativa < NOVAS_TENTATIVAS) await esperar(esperaPadrao);
        continue;
      }

      if (resposta.ok) return resposta.json() as Promise<unknown>;

      ultimoErro = new TmdbErro(`TMDB respondeu ${resposta.status}`, resposta.status);
      if (!deveRepetir(resposta.status) || tentativa === NOVAS_TENTATIVAS) break;
      await esperar(
        resposta.status === 429 ? esperaRetryAfter(resposta, esperaPadrao) : esperaPadrao,
      );
    }

    if (ultimoErro.status !== 404) {
      console.error(`[tmdb] ${caminho}: ${ultimoErro.message}`);
    }
    throw ultimoErro;
  }

  return { requisitar };
}

let padrao: ClienteTmdb | undefined;

/** Cliente configurado pelas variáveis de ambiente do servidor. */
export function clienteTmdbPadrao(): ClienteTmdb {
  if (!padrao) {
    const env = getServerEnv();
    padrao = criarClienteTmdb({ token: env.TMDB_READ_TOKEN, baseUrl: env.TMDB_API_URL });
  }
  return padrao;
}
