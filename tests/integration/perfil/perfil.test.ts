import { describe, expect, it } from "vitest";

import { criarUsuario } from "../../support/supabase-local";

describe("atualização do perfil", () => {
  it("o usuário troca o próprio nome; o banco recusa nome com 1 caractere", async () => {
    const { cliente, id } = await criarUsuario("Nome Antigo");

    const { error } = await cliente.from("perfis").update({ nome: "Nome Novo" }).eq("id", id);
    expect(error).toBeNull();
    expect((await cliente.from("perfis").select("nome").single()).data?.nome).toBe("Nome Novo");

    const curto = await cliente.from("perfis").update({ nome: "A" }).eq("id", id);
    expect(curto.error?.code).toBe("23514");
  });

  it("o usuário atualiza as próprias preferências; o banco recusa 6 gêneros", async () => {
    const { cliente, id } = await criarUsuario();
    await cliente
      .from("preferencias")
      .insert({ usuario_id: id, generos: [28], duracao: "media", frequencia: "semanal" });

    const { error } = await cliente
      .from("preferencias")
      .update({ generos: [27, 53], duracao: "curta", frequencia: "diaria" })
      .eq("usuario_id", id);
    expect(error).toBeNull();
    expect((await cliente.from("preferencias").select("generos, duracao").single()).data).toEqual({
      generos: [27, 53],
      duracao: "curta",
    });

    const demais = await cliente
      .from("preferencias")
      .update({ generos: [28, 18, 35, 27, 53, 99] })
      .eq("usuario_id", id);
    expect(demais.error?.code).toBe("23514");
  });
});
