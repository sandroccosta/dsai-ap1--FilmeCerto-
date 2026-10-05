import { describe, expect, it } from "vitest";

import { EnvError, parsePublicEnv, parseServerEnv } from "@/lib/env";

const validEnv = {
  NEXT_PUBLIC_SUPABASE_URL: "https://exemplo.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_teste",
  TMDB_READ_TOKEN: "token-de-teste",
};

describe("parseServerEnv", () => {
  it("retorna os valores tipados quando todas as variáveis estão presentes", () => {
    expect(parseServerEnv(validEnv)).toEqual({
      ...validEnv,
      TMDB_API_URL: "https://api.themoviedb.org/3",
    });
  });

  it("aceita outra URL base para o TMDB", () => {
    const env = parseServerEnv({ ...validEnv, TMDB_API_URL: "http://127.0.0.1:4010/3" });
    expect(env.TMDB_API_URL).toBe("http://127.0.0.1:4010/3");
  });

  it("lança EnvError citando a variável ausente", () => {
    const semToken = { ...validEnv, TMDB_READ_TOKEN: undefined };

    expect(() => parseServerEnv(semToken)).toThrow(EnvError);
    expect(() => parseServerEnv(semToken)).toThrow(/TMDB_READ_TOKEN/);
  });

  it("cita todas as variáveis ausentes de uma vez", () => {
    try {
      parseServerEnv({});
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(EnvError);
      expect((error as EnvError).variables).toEqual([
        "NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
        "TMDB_READ_TOKEN",
      ]);
    }
  });

  it("rejeita URL do Supabase inválida", () => {
    expect(() => parseServerEnv({ ...validEnv, NEXT_PUBLIC_SUPABASE_URL: "nao-e-url" })).toThrow(
      /NEXT_PUBLIC_SUPABASE_URL/,
    );
  });

  it("rejeita variável vazia", () => {
    expect(() => parseServerEnv({ ...validEnv, TMDB_READ_TOKEN: "" })).toThrow(/TMDB_READ_TOKEN/);
  });
});

describe("parsePublicEnv", () => {
  it("não exige o token do TMDB", () => {
    const publico = { ...validEnv, TMDB_READ_TOKEN: undefined };
    expect(parsePublicEnv(publico)).toEqual(publico);
  });

  it("não expõe variáveis do servidor no resultado", () => {
    expect(parsePublicEnv(validEnv)).not.toHaveProperty("TMDB_READ_TOKEN");
  });
});
