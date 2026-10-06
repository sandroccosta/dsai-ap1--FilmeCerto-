import { beforeAll, describe, expect, it } from "vitest";

import { criarUsuario } from "../../support/supabase-local";

describe("RLS de preferencias", () => {
  let a: Awaited<ReturnType<typeof criarUsuario>>;
  let b: Awaited<ReturnType<typeof criarUsuario>>;

  beforeAll(async () => {
    a = await criarUsuario("Usuária A");
    b = await criarUsuario("Usuário B");
    const { error } = await b.cliente
      .from("preferencias")
      .upsert({ usuario_id: b.id, generos: [27], duracao: "curta", frequencia: "mensal" });
    if (error) throw error;
  });

  it("o usuário grava e lê as próprias preferências, e o upsert atualiza a mesma linha", async () => {
    const primeira = await a.cliente
      .from("preferencias")
      .upsert({ usuario_id: a.id, generos: [28, 18], duracao: "media", frequencia: "semanal" });
    expect(primeira.error).toBeNull();

    const segunda = await a.cliente
      .from("preferencias")
      .upsert({ usuario_id: a.id, generos: [35], duracao: "longa", frequencia: "diaria" });
    expect(segunda.error).toBeNull();

    const { data } = await a.cliente
      .from("preferencias")
      .select("usuario_id, generos, duracao, frequencia");
    expect(data).toEqual([
      { usuario_id: a.id, generos: [35], duracao: "longa", frequencia: "diaria" },
    ]);
  });

  it("o usuário recebe zero linhas ao ler as preferências de outro", async () => {
    const { data, error } = await a.cliente
      .from("preferencias")
      .select("usuario_id")
      .eq("usuario_id", b.id);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("o update de um usuário nas preferências de outro não altera nada", async () => {
    const { data } = await a.cliente
      .from("preferencias")
      .update({ generos: [99] })
      .eq("usuario_id", b.id)
      .select();
    expect(data).toEqual([]);

    const { data: deB } = await b.cliente.from("preferencias").select("generos").single();
    expect(deB?.generos).toEqual([27]);
  });

  it("o usuário não consegue inserir preferências em nome de outro", async () => {
    const outro = await criarUsuario("Usuário C");
    const { error } = await a.cliente
      .from("preferencias")
      .insert({ usuario_id: outro.id, generos: [28], duracao: "curta", frequencia: "mensal" });
    expect(error?.code).toBe("42501");
  });

  it.each([
    ["vazio", []],
    ["com 6 itens", [28, 18, 35, 27, 53, 99]],
    ["com ID fora da lista", [28, 1]],
  ])("o banco recusa generos %s", async (_caso, generos) => {
    const { cliente, id } = await criarUsuario();
    const { error } = await cliente
      .from("preferencias")
      .insert({ usuario_id: id, generos, duracao: "media", frequencia: "semanal" });
    expect(error?.code).toBe("23514");
  });
});

describe("gêneros evitados e streamings em preferencias", () => {
  const base = { generos: [28, 18], duracao: "media" as const, frequencia: "semanal" as const };

  it("sem os campos novos, a linha fica com listas vazias", async () => {
    const { cliente, id } = await criarUsuario();
    const { data, error } = await cliente
      .from("preferencias")
      .insert({ usuario_id: id, ...base })
      .select("generos_evitados, streamings")
      .single();
    expect(error).toBeNull();
    expect(data).toEqual({ generos_evitados: [], streamings: [] });
  });

  it("o usuário atualiza os próprios gêneros evitados e streamings", async () => {
    const { cliente, id } = await criarUsuario();
    await cliente.from("preferencias").insert({ usuario_id: id, ...base });

    const { error } = await cliente
      .from("preferencias")
      .update({ generos_evitados: [27, 53], streamings: [8, 119] })
      .eq("usuario_id", id);
    expect(error).toBeNull();

    const { data } = await cliente
      .from("preferencias")
      .select("generos_evitados, streamings")
      .single();
    expect(data).toEqual({ generos_evitados: [27, 53], streamings: [8, 119] });
  });

  it("o update de um usuário nos campos novos de outro não altera nada", async () => {
    const dono = await criarUsuario();
    const intruso = await criarUsuario();
    await dono.cliente.from("preferencias").insert({ usuario_id: dono.id, ...base });

    const { data } = await intruso.cliente
      .from("preferencias")
      .update({ generos_evitados: [27], streamings: [8] })
      .eq("usuario_id", dono.id)
      .select();
    expect(data).toEqual([]);

    const { data: doDono } = await dono.cliente
      .from("preferencias")
      .select("generos_evitados, streamings")
      .single();
    expect(doDono).toEqual({ generos_evitados: [], streamings: [] });
  });

  it.each([
    ["igual a um favorito", { generos_evitados: [18] }],
    ["com 6 gêneros evitados", { generos_evitados: [27, 53, 99, 37, 10752, 36] }],
    ["com gênero evitado fora da lista", { generos_evitados: [1] }],
    ["com 11 streamings", { streamings: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] }],
  ])("o banco recusa preferências %s", async (_caso, extras) => {
    const { cliente, id } = await criarUsuario();
    const { error } = await cliente
      .from("preferencias")
      .insert({ usuario_id: id, ...base, ...extras });
    expect(error?.code).toBe("23514");
  });
});
