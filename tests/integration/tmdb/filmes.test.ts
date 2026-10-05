import { describe, expect, it } from "vitest";

import { criarClienteTmdb } from "@/lib/tmdb/cliente";
import { criarApiFilmes } from "@/lib/tmdb/filmes";

import { TOKEN_TMDB_REAL } from "../../support/tmdb-real";

describe.skipIf(!TOKEN_TMDB_REAL)("cliente do TMDB contra a API real", () => {
  const api = criarApiFilmes(
    criarClienteTmdb({ token: TOKEN_TMDB_REAL ?? "", baseUrl: "https://api.themoviedb.org/3" }),
  );

  it("descobrirFilmes com Drama devolve só filmes de drama", async () => {
    const pagina = await api.descobrirFilmes({ generos: [18] });
    expect(pagina.itens.length).toBeGreaterThan(0);
    for (const filme of pagina.itens) expect(filme.generos).toContain(18);
  });

  it("obterFilme(550) devolve Clube da Luta com duração e trailer", async () => {
    const filme = await api.obterFilme(550);
    expect(filme?.titulo).toBeTruthy();
    expect(filme?.duracaoMin).toBeGreaterThan(0);
    expect(filme?.trailerYoutube).not.toBeNull();
  });

  it("obterFilme de um ID inexistente devolve null", async () => {
    expect(await api.obterFilme(999999999)).toBeNull();
  });
});
