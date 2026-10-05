import { describe, expect, it } from "vitest";

import { planejar } from "@/features/recomendacao/planejar";
import { criarGerador } from "@/features/recomendacao/semente";
import type { EntradaMotor, ReacaoMotor } from "@/features/recomendacao/tipos";

function entrada(sobrescrever: Partial<EntradaMotor> = {}): EntradaMotor {
  return {
    preferencias: { generos: [53, 18, 28], duracao: "media", frequencia: "semanal" },
    usuarioId: "u1",
    data: new Date("2026-10-05T15:00:00Z"),
    ...sobrescrever,
  };
}

const reacao = (tmdbId: number, tipo: ReacaoMotor["reacao"]): ReacaoMotor => ({
  tmdbId,
  titulo: `Filme ${tmdbId}`,
  reacao: tipo,
  generos: [18],
});

describe("planejar", () => {
  it("gera 2 consultas 'para você' em páginas diferentes e 1 por gênero, na ordem de GENEROS", () => {
    for (let rodada = 0; rodada < 30; rodada++) {
      const plano = planejar(entrada({ rodada }), criarGerador("u1", new Date(), rodada));
      const paraVoce = plano.filter((c) => c.tipo === "para-voce");

      expect(paraVoce).toHaveLength(2);
      const [a, b] = paraVoce.map((c) => (c.tipo === "para-voce" ? c.filtros : undefined));
      expect(a?.pagina).not.toBe(b?.pagina);
      for (const filtros of [a, b]) {
        expect(filtros).toMatchObject({
          generos: [53, 18, 28],
          duracaoMin: 90,
          duracaoMax: 120,
          votosMin: 300,
          notaMin: 6.5,
          ordem: "popularidade",
        });
        expect(filtros?.pagina).toBeGreaterThanOrEqual(1);
        expect(filtros?.pagina).toBeLessThanOrEqual(5);
      }

      const porGenero = plano.filter((c) => c.tipo === "genero");
      expect(porGenero.map((c) => (c.tipo === "genero" ? c.generoId : 0))).toEqual([28, 18, 53]);
    }
  });

  it("com frequência 'raramente' as páginas ficam entre 1 e 2", () => {
    const plano = planejar(
      entrada({ preferencias: { generos: [18], duracao: "indiferente", frequencia: "raramente" } }),
      criarGerador("u1", new Date(), 0),
    );
    const paginas = plano.flatMap((c) =>
      c.tipo === "genero" ? [] : [c.tipo === "para-voce" ? c.filtros.pagina : 0],
    );
    expect(paginas.sort()).toEqual([1, 2]);
  });

  it("gera 1 consulta de parecidos por Amei ou Gostei, no máximo 3, Amei primeiro", () => {
    const plano = planejar(
      entrada({
        reacoes: [
          reacao(1, "gostei"),
          reacao(2, "nao-gostei"),
          reacao(3, "amei"),
          reacao(4, "nao-gostei"),
          reacao(5, "gostei"),
          reacao(6, "amei"),
        ],
      }),
      criarGerador("u1", new Date(), 0),
    );
    const origens = plano.flatMap((c) => (c.tipo === "parecidos" ? [c.origem.tmdbId] : []));
    expect(origens).toEqual([3, 6, 1]);
  });

  it("sem reações não há consultas de parecidos", () => {
    const plano = planejar(entrada(), criarGerador("u1", new Date(), 0));
    expect(plano.some((c) => c.tipo === "parecidos")).toBe(false);
  });
});
