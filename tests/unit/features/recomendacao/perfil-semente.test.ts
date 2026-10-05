import { describe, expect, it } from "vitest";

import { filtrosDeDuracao, PERFIS } from "@/features/recomendacao/perfil";
import { criarGerador, diaEmSaoPaulo, sortearInteiro } from "@/features/recomendacao/semente";

describe("perfil", () => {
  it.each([
    ["curta", { duracaoMax: 90 }],
    ["media", { duracaoMin: 90, duracaoMax: 120 }],
    ["longa", { duracaoMin: 120 }],
    ["indiferente", {}],
  ] as const)("duração %s vira %j", (duracao, filtros) => {
    expect(filtrosDeDuracao(duracao)).toEqual(filtros);
  });

  it("cada frequência tem votos, nota e páginas da tabela", () => {
    expect(PERFIS).toEqual({
      raramente: { votosMin: 2000, notaMin: 7, paginaMax: 2 },
      mensal: { votosMin: 1000, notaMin: 6.5, paginaMax: 3 },
      semanal: { votosMin: 300, notaMin: 6.5, paginaMax: 5 },
      diaria: { votosMin: 100, notaMin: 6, paginaMax: 10 },
    });
  });
});

describe("semente", () => {
  const sequencia = (gerador: () => number) => Array.from({ length: 5 }, gerador);
  const hoje = new Date("2026-10-05T15:00:00Z");

  it("a mesma entrada gera a mesma sequência", () => {
    expect(sequencia(criarGerador("u1", hoje, 0))).toEqual(sequencia(criarGerador("u1", hoje, 0)));
  });

  it("mudar rodada, dia ou usuário muda a sequência", () => {
    const base = sequencia(criarGerador("u1", hoje, 0));
    expect(sequencia(criarGerador("u1", hoje, 1))).not.toEqual(base);
    expect(sequencia(criarGerador("u1", new Date("2026-10-06T15:00:00Z"), 0))).not.toEqual(base);
    expect(sequencia(criarGerador("u2", hoje, 0))).not.toEqual(base);
  });

  it("gera números em [0, 1)", () => {
    for (const valor of Array.from({ length: 1000 }, criarGerador("u1", hoje, 3))) {
      expect(valor).toBeGreaterThanOrEqual(0);
      expect(valor).toBeLessThan(1);
    }
  });

  it("conta o dia no fuso de São Paulo", () => {
    expect(diaEmSaoPaulo(new Date("2026-10-05T02:00:00Z"))).toBe("2026-10-04");
    expect(diaEmSaoPaulo(new Date("2026-10-05T23:00:00Z"))).toBe("2026-10-05");
    expect(sequencia(criarGerador("u1", new Date("2026-10-05T02:00:00Z"), 0))).not.toEqual(
      sequencia(criarGerador("u1", new Date("2026-10-05T23:00:00Z"), 0)),
    );
  });

  it("sortearInteiro fica dentro da faixa, inclusive nas pontas", () => {
    expect(sortearInteiro(() => 0, 1, 5)).toBe(1);
    expect(sortearInteiro(() => 0.9999, 1, 5)).toBe(5);
  });
});
