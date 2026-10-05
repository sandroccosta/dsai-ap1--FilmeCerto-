import { describe, expect, it, vi } from "vitest";

import { gerarRecomendacoes, type ApiMotor } from "@/features/recomendacao/gerar";
import type { EntradaMotor } from "@/features/recomendacao/tipos";
import { TmdbErro } from "@/lib/tmdb/cliente";
import type { FiltrosDescoberta, Pagina } from "@/lib/tmdb/tipos";

import { filme } from "./fabrica";

const pagina = (itens: ReturnType<typeof filme>[]): Pagina<ReturnType<typeof filme>> => ({
  itens,
  pagina: 1,
  totalPaginas: 1,
  totalResultados: itens.length,
});

/** TMDB falso: "para você" devolve 30 filmes de drama/terror; cada gênero, 25 do próprio gênero. */
function apiFalsa(falharGenero?: number): ApiMotor {
  return {
    descobrirFilmes: vi.fn(async (filtros: FiltrosDescoberta = {}) => {
      const generos = filtros.generos ?? [];
      if (generos.length > 1) {
        const base = (filtros.pagina ?? 1) * 1000;
        return pagina(
          Array.from({ length: 30 }, (_, i) =>
            filme(base + i, { generos: [i % 2 ? 18 : 27], popularidade: 100 - i }),
          ),
        );
      }
      const [genero] = generos;
      if (genero === falharGenero) throw new TmdbErro("TMDB respondeu 503", 503);
      return pagina(
        Array.from({ length: 25 }, (_, i) =>
          // Os 5 primeiros repetem filmes que podem estar em "para você".
          filme(i < 5 ? 1000 + i : (genero ?? 0) * 100 + i, { generos: [genero ?? 0] }),
        ),
      );
    }),
    recomendacoesDe: vi.fn(async (id: number) =>
      pagina([filme(id + 1, { titulo: `Parecido ${id}` }), filme(5000)]),
    ),
  };
}

const entrada: EntradaMotor = {
  preferencias: { generos: [27, 18], duracao: "indiferente", frequencia: "raramente" },
  usuarioId: "u1",
  data: new Date("2026-10-05T15:00:00Z"),
};

describe("gerarRecomendacoes", () => {
  it("devolve 'para você' e uma seção por gênero, sem repetir filmes", async () => {
    const secoes = await gerarRecomendacoes(entrada, apiFalsa());

    expect(secoes.map((s) => [s.id, s.titulo])).toEqual([
      ["para-voce", "Escolhidos para você"],
      ["genero-18", "Drama para você"],
      ["genero-27", "Terror para você"],
    ]);
    expect(secoes[0]?.filmes).toHaveLength(20);

    const ids = secoes.flatMap((s) => s.filmes.map((f) => f.id));
    expect(new Set(ids).size).toBe(ids.length);

    for (const f of secoes[1]?.filmes ?? []) expect(f.generos).toContain(18);
    expect(secoes[1]?.filmes[0]?.motivo).toBe("Porque você curte Drama");
  });

  it("ordena 'para você' pela pontuação", async () => {
    const [paraVoce] = await gerarRecomendacoes(entrada, apiFalsa());
    const pontuacoes = paraVoce?.filmes.map((f) => f.pontuacao) ?? [];
    expect(pontuacoes).toEqual([...pontuacoes].sort((a, b) => b - a));
  });

  it("inclui as seções de parecidos depois de 'para você' e exclui os avaliados", async () => {
    const secoes = await gerarRecomendacoes(
      {
        ...entrada,
        avaliacoes: [
          { tmdbId: 700, titulo: "Interestelar", nota: 5, generos: [878] },
          { tmdbId: 5000, titulo: "Já visto", nota: 4, generos: [18] },
        ],
      },
      apiFalsa(),
    );

    expect(secoes.map((s) => s.id).slice(0, 2)).toEqual(["para-voce", "parecidos-700"]);
    expect(secoes[1]?.titulo).toBe("Porque você deu 5★ para Interestelar");
    expect(secoes[1]?.filmes[0]?.motivo).toBe("Parecido com Interestelar, que você deu 5★");
    const ids = secoes.flatMap((s) => s.filmes.map((f) => f.id));
    expect(ids).not.toContain(5000);
    expect(ids).not.toContain(700);
  });

  it("nunca devolve filmes em 'excluir'", async () => {
    const secoes = await gerarRecomendacoes({ ...entrada, excluir: [1001, 1003] }, apiFalsa());
    const ids = secoes.flatMap((s) => s.filmes.map((f) => f.id));
    expect(ids).not.toContain(1001);
    expect(ids).not.toContain(1003);
  });

  it("se a consulta de um gênero falha, só aquela seção vem com erro", async () => {
    const erro = vi.spyOn(console, "error").mockImplementation(() => {});
    const secoes = await gerarRecomendacoes(entrada, apiFalsa(27));
    erro.mockRestore();

    const terror = secoes.find((s) => s.id === "genero-27");
    expect(terror).toEqual({ id: "genero-27", titulo: "Terror para você", filmes: [], erro: true });
    expect(secoes.find((s) => s.id === "genero-18")?.filmes.length).toBeGreaterThan(0);
    expect(secoes[0]?.filmes).toHaveLength(20);
  });

  it("a mesma entrada gera exatamente a mesma saída", async () => {
    expect(await gerarRecomendacoes(entrada, apiFalsa())).toEqual(
      await gerarRecomendacoes(entrada, apiFalsa()),
    );
  });
});
