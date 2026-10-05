import { describe, expect, it } from "vitest";

import { GENEROS } from "@/features/preferencias/generos";
import { MENSAGENS, preferenciasSchema } from "@/features/preferencias/schema";

const valido = { generos: [28, 18], duracao: "media", frequencia: "semanal" };

function erroDe(dados: Record<string, unknown>) {
  const resultado = preferenciasSchema.safeParse(dados);
  return resultado.success ? undefined : resultado.error.issues[0]?.message;
}

describe("GENEROS", () => {
  it("tem os 19 gêneros do TMDB com IDs únicos", () => {
    expect(GENEROS).toHaveLength(19);
    expect(new Set(GENEROS.map((genero) => genero.id)).size).toBe(19);
  });

  it("está em ordem alfabética de nome", () => {
    const nomes = GENEROS.map((genero) => genero.nome);
    expect(nomes).toEqual([...nomes].sort((a, b) => a.localeCompare(b, "pt-BR")));
  });
});

describe("preferenciasSchema", () => {
  it("aceita 1 gênero", () => {
    expect(preferenciasSchema.safeParse({ ...valido, generos: [28] }).success).toBe(true);
  });

  it("aceita 5 gêneros", () => {
    expect(preferenciasSchema.safeParse({ ...valido, generos: [28, 18, 35, 27, 53] }).success).toBe(
      true,
    );
  });

  it.each([
    ["nenhum gênero", []],
    ["6 gêneros", [28, 18, 35, 27, 53, 99]],
    ["ID fora da lista", [28, 1]],
    ["gênero repetido", [28, 28]],
  ])("rejeita %s", (_caso, generos) => {
    expect(erroDe({ ...valido, generos })).toBe(MENSAGENS.generos);
  });

  it("rejeita duração inválida", () => {
    expect(erroDe({ ...valido, duracao: "enorme" })).toBe(MENSAGENS.duracao);
  });

  it("rejeita frequência inválida", () => {
    expect(erroDe({ ...valido, frequencia: "anual" })).toBe(MENSAGENS.frequencia);
  });
});
