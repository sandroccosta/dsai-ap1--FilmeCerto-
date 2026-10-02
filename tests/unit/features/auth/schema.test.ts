import { describe, expect, it } from "vitest";

import { cadastroSchema, loginSchema, MENSAGENS } from "@/features/auth/schema";

const cadastroValido = {
  nome: "Ana Souza",
  email: "ana@example.com",
  senha: "filme1234",
  confirmacao: "filme1234",
};

function errosDe(dados: Record<string, unknown>) {
  const resultado = cadastroSchema.safeParse(dados);
  if (resultado.success) return {};
  return Object.fromEntries(resultado.error.issues.map((issue) => [issue.path[0], issue.message]));
}

describe("cadastroSchema", () => {
  it("aceita dados válidos e remove espaços das pontas do nome", () => {
    const resultado = cadastroSchema.safeParse({ ...cadastroValido, nome: "  Ana Souza  " });
    expect(resultado.success).toBe(true);
    expect(resultado.data?.nome).toBe("Ana Souza");
  });

  it("rejeita nome com menos de 2 caracteres", () => {
    expect(errosDe({ ...cadastroValido, nome: " A " })).toEqual({ nome: MENSAGENS.nome });
  });

  it("rejeita nome com mais de 50 caracteres", () => {
    expect(errosDe({ ...cadastroValido, nome: "a".repeat(51) })).toEqual({
      nome: MENSAGENS.nome,
    });
  });

  it("rejeita email inválido", () => {
    expect(errosDe({ ...cadastroValido, email: "ana@" })).toEqual({ email: MENSAGENS.email });
  });

  it("rejeita senha sem número", () => {
    expect(errosDe({ ...cadastroValido, senha: "sónumeros", confirmacao: "sónumeros" })).toEqual({
      senha: MENSAGENS.senha,
    });
  });

  it("rejeita senha sem letra", () => {
    expect(errosDe({ ...cadastroValido, senha: "12345678", confirmacao: "12345678" })).toEqual({
      senha: MENSAGENS.senha,
    });
  });

  it("rejeita senha curta", () => {
    expect(errosDe({ ...cadastroValido, senha: "abc123", confirmacao: "abc123" })).toEqual({
      senha: MENSAGENS.senha,
    });
  });

  it("rejeita confirmação diferente da senha", () => {
    expect(errosDe({ ...cadastroValido, confirmacao: "outra1234" })).toEqual({
      confirmacao: MENSAGENS.confirmacao,
    });
  });
});

describe("loginSchema", () => {
  it("aceita email e qualquer senha preenchida", () => {
    expect(loginSchema.safeParse({ email: "ana@example.com", senha: "x" }).success).toBe(true);
  });

  it("exige a senha", () => {
    const resultado = loginSchema.safeParse({ email: "ana@example.com", senha: "" });
    expect(resultado.error?.issues[0]?.message).toBe(MENSAGENS.senhaLogin);
  });

  it("exige email válido", () => {
    const resultado = loginSchema.safeParse({ email: "ana", senha: "x" });
    expect(resultado.error?.issues[0]?.message).toBe(MENSAGENS.email);
  });
});
