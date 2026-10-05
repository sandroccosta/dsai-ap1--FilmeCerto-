import { beforeAll, describe, expect, it } from "vitest";

import { criarUsuario } from "../../support/supabase-local";

const item = (usuarioId: string, tmdbId: number, status: "quero_assistir" | "assistido") => ({
  usuario_id: usuarioId,
  tmdb_id: tmdbId,
  status,
  titulo: `Filme ${tmdbId}`,
  poster_path: null,
  ano: 2020,
  generos: [18],
});

describe("RLS de lista_itens", () => {
  let a: Awaited<ReturnType<typeof criarUsuario>>;
  let b: Awaited<ReturnType<typeof criarUsuario>>;

  beforeAll(async () => {
    a = await criarUsuario("Usuária A");
    b = await criarUsuario("Usuário B");
    const { error } = await b.cliente.from("lista_itens").insert(item(b.id, 550, "assistido"));
    if (error) throw error;
  });

  it("o usuário adiciona, troca de lista e remove o próprio item", async () => {
    const lista = a.cliente.from("lista_itens");
    expect((await lista.upsert(item(a.id, 13, "quero_assistir"))).error).toBeNull();
    expect((await lista.upsert(item(a.id, 13, "assistido"))).error).toBeNull();

    const { data } = await a.cliente.from("lista_itens").select("tmdb_id, status");
    expect(data).toEqual([{ tmdb_id: 13, status: "assistido" }]);

    await a.cliente.from("lista_itens").delete().eq("tmdb_id", 13);
    expect((await a.cliente.from("lista_itens").select("tmdb_id")).data).toEqual([]);
  });

  it("o usuário não lê, não altera e não apaga os itens de outro", async () => {
    const leitura = await a.cliente.from("lista_itens").select("tmdb_id").eq("usuario_id", b.id);
    expect(leitura.data).toEqual([]);

    const alteracao = await a.cliente
      .from("lista_itens")
      .update({ status: "quero_assistir" })
      .eq("usuario_id", b.id)
      .select();
    expect(alteracao.data).toEqual([]);

    const exclusao = await a.cliente.from("lista_itens").delete().eq("usuario_id", b.id).select();
    expect(exclusao.data).toEqual([]);

    const { data } = await b.cliente.from("lista_itens").select("status").single();
    expect(data?.status).toBe("assistido");
  });

  it("o usuário não insere item em nome de outro", async () => {
    const { error } = await a.cliente.from("lista_itens").insert(item(b.id, 99, "assistido"));
    expect(error?.code).toBe("42501");
  });

  it("o banco recusa status fora do enum e tmdb_id 0", async () => {
    const invalido = await a.cliente
      .from("lista_itens")
      .insert({ ...item(a.id, 77, "assistido"), status: "favorito" as "assistido" });
    expect(invalido.error?.code).toBe("22P02");

    const idZero = await a.cliente.from("lista_itens").insert(item(a.id, 0, "assistido"));
    expect(idZero.error?.code).toBe("23514");
  });
});
