import { describe, expect, it } from "vitest";

import { GENEROS } from "@/features/preferencias/generos";
import { MENSAGENS, onboardingSchema, preferenciasSchema } from "@/features/preferencias/schema";
import { STREAMINGS } from "@/features/preferencias/streamings";

const valido = { generos: [28, 18], duracao: "media", frequencia: "semanal" };

function erroDe(dados: Record<string, unknown>) {
  const resultado = preferenciasSchema.safeParse(dados);
  return resultado.success ? undefined : resultado.error.issues[0]?.message;
}

function erroOnboarding(dados: Record<string, unknown>) {
  const resultado = onboardingSchema.safeParse({ ...valido, ...dados });
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

describe("STREAMINGS", () => {
  it("tem no máximo 10 serviços, com IDs únicos", () => {
    expect(STREAMINGS.length).toBeLessThanOrEqual(10);
    expect(new Set(STREAMINGS.map((s) => s.id)).size).toBe(STREAMINGS.length);
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

  it("sem gêneros evitados nem streamings, assume listas vazias", () => {
    const resultado = preferenciasSchema.parse(valido);
    expect(resultado.generosEvitados).toEqual([]);
    expect(resultado.streamings).toEqual([]);
  });

  it("aceita até 5 gêneros evitados e streamings da lista", () => {
    const resultado = preferenciasSchema.safeParse({
      ...valido,
      generosEvitados: [27, 53, 99, 37, 10752],
      streamings: [8, 119],
    });
    expect(resultado.success).toBe(true);
  });

  it.each([
    ["6 gêneros evitados", [27, 53, 99, 37, 10752, 36]],
    ["gênero evitado fora da lista", [1]],
    ["gênero evitado repetido", [27, 27]],
    ["gênero evitado igual a um favorito", [18]],
  ])("rejeita %s", (_caso, generosEvitados) => {
    expect(erroDe({ ...valido, generosEvitados })).toBe(MENSAGENS.generosEvitados);
  });

  it.each([
    ["streaming fora da lista", [999999]],
    ["streaming repetido", [8, 8]],
  ])("rejeita %s", (_caso, streamings) => {
    expect(erroDe({ ...valido, streamings })).toBe(MENSAGENS.streamings);
  });
});

describe("onboardingSchema", () => {
  it("aceita até 5 amados e 5 rejeitados diferentes", () => {
    const resultado = onboardingSchema.safeParse({
      ...valido,
      amados: [1, 2, 3, 4, 5],
      rejeitados: [6, 7, 8, 9, 10],
    });
    expect(resultado.success).toBe(true);
  });

  it("sem filmes, assume listas vazias", () => {
    const resultado = onboardingSchema.parse(valido);
    expect(resultado.amados).toEqual([]);
    expect(resultado.rejeitados).toEqual([]);
  });

  it.each([
    ["6 amados", [1, 2, 3, 4, 5, 6]],
    ["amado repetido", [1, 1]],
    ["ID inválido", [0]],
  ])("rejeita %s", (_caso, amados) => {
    expect(erroOnboarding({ amados })).toBe(MENSAGENS.amados);
  });

  it.each([
    ["6 rejeitados", [1, 2, 3, 4, 5, 6]],
    ["rejeitado repetido", [1, 1]],
  ])("rejeita %s", (_caso, rejeitados) => {
    expect(erroOnboarding({ rejeitados })).toBe(MENSAGENS.rejeitados);
  });

  it("rejeita um filme que está em amados e em rejeitados", () => {
    expect(erroOnboarding({ amados: [1, 2], rejeitados: [2] })).toBe(MENSAGENS.rejeitados);
  });

  it("continua validando as preferências", () => {
    expect(erroOnboarding({ generos: [] })).toBe(MENSAGENS.generos);
    expect(erroOnboarding({ generosEvitados: [28] })).toBe(MENSAGENS.generosEvitados);
  });
});
