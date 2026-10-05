import { beforeAll, describe, expect, it } from "vitest";

import { criarUsuario } from "../../support/supabase-local";

const linha = (usuarioId: string, tmdbId: number, reacao: "nao-gostei" | "gostei" | "amei") => ({
  usuario_id: usuarioId,
  tmdb_id: tmdbId,
  reacao,
  titulo: `Filme ${tmdbId}`,
  generos: [18],
});

describe("RLS de reacoes", () => {
  let a: Awaited<ReturnType<typeof criarUsuario>>;
  let b: Awaited<ReturnType<typeof criarUsuario>>;

  beforeAll(async () => {
    a = await criarUsuario("Usuária A");
    b = await criarUsuario("Usuário B");
    const { error } = await b.cliente.from("reacoes").insert(linha(b.id, 550, "amei"));
    if (error) throw error;
  });

  it("o usuário grava, troca e apaga a própria reação", async () => {
    expect((await a.cliente.from("reacoes").upsert(linha(a.id, 13, "gostei"))).error).toBeNull();
    expect((await a.cliente.from("reacoes").upsert(linha(a.id, 13, "amei"))).error).toBeNull();

    const { data } = await a.cliente.from("reacoes").select("tmdb_id, reacao");
    expect(data).toEqual([{ tmdb_id: 13, reacao: "amei" }]);

    await a.cliente.from("reacoes").delete().eq("tmdb_id", 13);
    expect((await a.cliente.from("reacoes").select("tmdb_id")).data).toEqual([]);
  });

  it("o usuário não lê, não altera e não apaga as reações de outro", async () => {
    const leitura = await a.cliente.from("reacoes").select("tmdb_id").eq("usuario_id", b.id);
    expect(leitura.data).toEqual([]);

    const alteracao = await a.cliente
      .from("reacoes")
      .update({ reacao: "nao-gostei" })
      .eq("usuario_id", b.id)
      .select();
    expect(alteracao.data).toEqual([]);

    const exclusao = await a.cliente.from("reacoes").delete().eq("usuario_id", b.id).select();
    expect(exclusao.data).toEqual([]);

    const { data } = await b.cliente.from("reacoes").select("reacao").single();
    expect(data?.reacao).toBe("amei");
  });

  it("o usuário não insere reação em nome de outro", async () => {
    const { error } = await a.cliente.from("reacoes").insert(linha(b.id, 99, "gostei"));
    expect(error?.code).toBe("42501");
  });

  it("o banco recusa reação fora do enum e tmdb_id 0", async () => {
    const invalida = await a.cliente
      .from("reacoes")
      .insert({ ...linha(a.id, 77, "gostei"), reacao: "odiei" as "gostei" });
    expect(invalida.error?.code).toBe("22P02");

    const idZero = await a.cliente.from("reacoes").insert(linha(a.id, 0, "gostei"));
    expect(idZero.error?.code).toBe("23514");
  });
});
