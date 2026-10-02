import { randomUUID } from "node:crypto";

import { beforeAll, describe, expect, it } from "vitest";

import {
  criarUsuario,
  emailAleatorio,
  novoCliente,
  SENHA_TESTE,
} from "../../support/supabase-local";

describe("cadastro cria o perfil", () => {
  it("signUp com nome cria a linha em perfis com o mesmo id e o nome sem espaços", async () => {
    const { cliente, id } = await criarUsuario("  Ana Souza  ");

    const { data, error } = await cliente.from("perfis").select("id, nome").single();
    expect(error).toBeNull();
    expect(data).toEqual({ id, nome: "Ana Souza" });
  });

  it("signUp com nome de 1 caractere falha e nenhum usuário é criado", async () => {
    const cliente = novoCliente();
    const email = emailAleatorio();

    const { error } = await cliente.auth.signUp({
      email,
      password: SENHA_TESTE,
      options: { data: { nome: "A" } },
    });
    expect(error).not.toBeNull();

    const login = await cliente.auth.signInWithPassword({ email, password: SENHA_TESTE });
    expect(login.error?.code).toBe("invalid_credentials");
  });
});

describe("RLS de perfis", () => {
  let a: Awaited<ReturnType<typeof criarUsuario>>;
  let b: Awaited<ReturnType<typeof criarUsuario>>;

  beforeAll(async () => {
    a = await criarUsuario("Usuária A");
    b = await criarUsuario("Usuário B");
  });

  it("o usuário lê o próprio perfil", async () => {
    const { data } = await a.cliente.from("perfis").select("nome").eq("id", a.id);
    expect(data).toEqual([{ nome: "Usuária A" }]);
  });

  it("o usuário recebe zero linhas ao ler o perfil de outro", async () => {
    const { data, error } = await a.cliente.from("perfis").select("nome").eq("id", b.id);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("o update de um usuário no perfil de outro não altera nada", async () => {
    const { data } = await a.cliente
      .from("perfis")
      .update({ nome: "Invadido" })
      .eq("id", b.id)
      .select();
    expect(data).toEqual([]);

    const { data: perfilB } = await b.cliente.from("perfis").select("nome").single();
    expect(perfilB?.nome).toBe("Usuário B");
  });

  it("o usuário atualiza o próprio nome", async () => {
    const { error } = await b.cliente.from("perfis").update({ nome: "Bruno" }).eq("id", b.id);
    expect(error).toBeNull();
    const { data } = await b.cliente.from("perfis").select("nome").single();
    expect(data?.nome).toBe("Bruno");
  });

  it("o usuário não consegue inserir linhas em perfis", async () => {
    const { error } = await a.cliente.from("perfis").insert({ id: randomUUID(), nome: "Fantasma" });
    expect(error?.code).toBe("42501");
  });

  it("um visitante sem sessão recebe zero linhas", async () => {
    const { data, error } = await novoCliente().from("perfis").select("id");
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });
});
