import { describe, expect, it } from "vitest";

import { gerarRecomendacoes } from "@/features/recomendacao/gerar";
import { criarClienteTmdb } from "@/lib/tmdb/cliente";
import { criarApiFilmes } from "@/lib/tmdb/filmes";

import { TOKEN_TMDB_REAL } from "../../support/tmdb-real";

describe.skipIf(!TOKEN_TMDB_REAL)("motor de recomendação contra o TMDB real", () => {
  it("Drama, média, semanal: 'para você' não vazio e 'Drama para você' só com dramas", async () => {
    const api = criarApiFilmes(
      criarClienteTmdb({ token: TOKEN_TMDB_REAL ?? "", baseUrl: "https://api.themoviedb.org/3" }),
    );

    const secoes = await gerarRecomendacoes(
      {
        preferencias: { generos: [18], duracao: "media", frequencia: "semanal" },
        usuarioId: "teste-integracao",
        data: new Date(),
      },
      api,
    );

    const paraVoce = secoes.find((s) => s.id === "para-voce");
    expect(paraVoce?.erro).toBeUndefined();
    expect(paraVoce?.filmes.length).toBeGreaterThan(0);

    const drama = secoes.find((s) => s.id === "genero-18");
    expect(drama?.titulo).toBe("Drama para você");
    for (const filme of drama?.filmes ?? []) expect(filme.generos).toContain(18);
  });
});
