import { describe, expect, it, vi } from "vitest";

import { criarClienteTmdb, TmdbErro } from "@/lib/tmdb/cliente";
import { criarApiFilmes } from "@/lib/tmdb/filmes";

import { detalhesTmdb, filmeTmdb, paginaTmdb } from "./fixtures";

function montar(corpo: unknown, status = 200) {
  const fetchFalso = vi.fn(async () => new Response(JSON.stringify(corpo), { status }));
  const cliente = criarClienteTmdb({
    token: "t",
    baseUrl: "https://tmdb.falso/3",
    fetch: fetchFalso as unknown as typeof fetch,
    esperar: async () => {},
  });
  return { api: criarApiFilmes(cliente), fetchFalso };
}

function chamada(fetchFalso: ReturnType<typeof vi.fn>, indice = 0) {
  const [url, init] = fetchFalso.mock.calls[indice] as [string, { next: { revalidate: number } }];
  return { url: new URL(url), revalidate: init.next.revalidate };
}

describe("descobrirFilmes", () => {
  it("traduz todos os filtros para os parâmetros do TMDB", async () => {
    const { api, fetchFalso } = montar(paginaTmdb([]));

    await api.descobrirFilmes({
      generos: [28, 18],
      semGeneros: [27],
      duracaoMin: 90,
      duracaoMax: 120,
      notaMin: 6,
      votosMin: 100,
      ordem: "nota",
      pagina: 2,
    });

    const { url, revalidate } = chamada(fetchFalso);
    expect(url.pathname).toBe("/3/discover/movie");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      with_genres: "28|18",
      without_genres: "27",
      "with_runtime.gte": "90",
      "with_runtime.lte": "120",
      "vote_average.gte": "6",
      "vote_count.gte": "100",
      sort_by: "vote_average.desc",
      page: "2",
      language: "pt-BR",
      region: "BR",
      include_adult: "false",
    });
    expect(revalidate).toBe(6 * 3600);
  });

  it("envia primary_release_year quando há ano", async () => {
    const { api, fetchFalso } = montar(paginaTmdb([]));
    await api.descobrirFilmes({ ano: 2010 });
    expect(chamada(fetchFalso).url.searchParams.get("primary_release_year")).toBe("2010");
  });

  it("com provedores, busca só o que está por assinatura nesses streamings no Brasil", async () => {
    const { api, fetchFalso } = montar(paginaTmdb([]));
    await api.descobrirFilmes({ provedores: [8, 119] });
    const { searchParams } = chamada(fetchFalso).url;
    expect(searchParams.get("with_watch_providers")).toBe("8|119");
    expect(searchParams.get("watch_region")).toBe("BR");
    expect(searchParams.get("with_watch_monetization_types")).toBe("flatrate");
  });

  it("sem provedores, não filtra por streaming", async () => {
    const { api, fetchFalso } = montar(paginaTmdb([]));
    await api.descobrirFilmes({ provedores: [] });
    const { searchParams } = chamada(fetchFalso).url;
    expect(searchParams.has("with_watch_providers")).toBe(false);
    expect(searchParams.has("watch_region")).toBe(false);
    expect(searchParams.has("with_watch_monetization_types")).toBe(false);
  });

  it("usa popularidade e página 1 por padrão", async () => {
    const { api, fetchFalso } = montar(paginaTmdb([]));
    await api.descobrirFilmes();
    const { url } = chamada(fetchFalso);
    expect(url.searchParams.get("sort_by")).toBe("popularity.desc");
    expect(url.searchParams.get("page")).toBe("1");
    expect(url.searchParams.has("with_genres")).toBe(false);
  });

  it.each([
    [0, "1"],
    [600, "500"],
  ])("limita a página %i a %s", async (pagina, esperado) => {
    const { api, fetchFalso } = montar(paginaTmdb([]));
    await api.descobrirFilmes({ pagina });
    expect(chamada(fetchFalso).url.searchParams.get("page")).toBe(esperado);
  });

  it("converte a resposta em Pagina<FilmeResumo>", async () => {
    const { api } = montar(
      paginaTmdb([filmeTmdb(), filmeTmdb({ id: 1, release_date: "", poster_path: null })]),
    );

    const pagina = await api.descobrirFilmes();

    expect(pagina).toEqual({
      pagina: 1,
      totalPaginas: 3,
      totalResultados: 55,
      itens: [
        {
          id: 550,
          titulo: "Clube da Luta",
          tituloOriginal: "Fight Club",
          sinopse: "Um homem deprimido...",
          posterPath: "/poster.jpg",
          backdropPath: "/fundo.jpg",
          generos: [18, 53],
          ano: 1999,
          nota: 8.4,
          votos: 30000,
          popularidade: 70.5,
        },
        expect.objectContaining({ id: 1, ano: null, posterPath: null }),
      ],
    });
  });

  it("resposta fora do formato vira TmdbErro", async () => {
    const { api } = montar({ results: "isso não é uma lista" });
    await expect(api.descobrirFilmes()).rejects.toThrow(
      new TmdbErro("Resposta inesperada do TMDB", null),
    );
  });
});

describe("obterFilme", () => {
  it("pede os dados anexos numa chamada e converte os detalhes", async () => {
    const { api, fetchFalso } = montar(detalhesTmdb());

    const filme = await api.obterFilme(550);

    const { url, revalidate } = chamada(fetchFalso);
    expect(url.pathname).toBe("/3/movie/550");
    expect(url.searchParams.get("append_to_response")).toBe(
      "videos,credits,watch/providers,recommendations",
    );
    expect(url.searchParams.get("language")).toBe("pt-BR");
    expect(revalidate).toBe(24 * 3600);

    expect(filme).toMatchObject({
      id: 550,
      titulo: "Clube da Luta",
      ano: 1999,
      generos: [
        { id: 18, nome: "Drama" },
        { id: 53, nome: "Thriller" },
      ],
      duracaoMin: 139,
      slogan: null,
      trailerYoutube: "oficial",
      direcao: ["David Fincher"],
      ondeAssistir: {
        link: "https://www.themoviedb.org/movie/550/watch?locale=BR",
        assinatura: [{ id: 8, nome: "Netflix", logoPath: "/netflix.jpg" }],
        aluguel: [{ id: 2, nome: "Apple TV", logoPath: null }],
        compra: [],
      },
    });
    expect(filme?.elenco).toHaveLength(10);
    expect(filme?.elenco[0]).toEqual({ nome: "Ator 1", personagem: "Papel 1", fotoPath: null });
    expect(filme?.parecidos.map((p) => p.titulo)).toEqual(["Se7en"]);
  });

  it("usa trailer não oficial quando não há oficial, e null quando não há trailer", async () => {
    const semOficial = montar(
      detalhesTmdb({
        videos: { results: [{ key: "fan", site: "YouTube", type: "Trailer", official: false }] },
      }),
    );
    expect((await semOficial.api.obterFilme(550))?.trailerYoutube).toBe("fan");

    const semTrailer = montar(detalhesTmdb({ videos: { results: [] } }));
    expect((await semTrailer.api.obterFilme(550))?.trailerYoutube).toBeNull();
  });

  it("devolve ondeAssistir null quando não há dados para o BR", async () => {
    const { api } = montar(detalhesTmdb({ "watch/providers": { results: {} } }));
    expect((await api.obterFilme(550))?.ondeAssistir).toBeNull();
  });

  it("converte duração 0 em null", async () => {
    const { api } = montar(detalhesTmdb({ runtime: 0, tagline: "Mischief. Mayhem. Soap." }));
    const filme = await api.obterFilme(550);
    expect(filme?.duracaoMin).toBeNull();
    expect(filme?.slogan).toBe("Mischief. Mayhem. Soap.");
  });

  it("devolve null para 404", async () => {
    const { api } = montar({ status_code: 34 }, 404);
    expect(await api.obterFilme(1)).toBeNull();
  });
});

describe("recomendacoesDe", () => {
  it("chama /movie/{id}/recommendations com a página e 24 h de cache", async () => {
    const { api, fetchFalso } = montar(paginaTmdb([filmeTmdb()], 2));
    const pagina = await api.recomendacoesDe(550, 2);
    const { url, revalidate } = chamada(fetchFalso);
    expect(url.pathname).toBe("/3/movie/550/recommendations");
    expect(url.searchParams.get("page")).toBe("2");
    expect(revalidate).toBe(24 * 3600);
    expect(pagina.itens[0]?.titulo).toBe("Clube da Luta");
  });
});

describe("buscarFilmes", () => {
  it("chama /search/movie com o texto sem espaços nas pontas", async () => {
    const { api, fetchFalso } = montar(paginaTmdb([filmeTmdb()]));
    await api.buscarFilmes("  clube da luta ");
    const { url, revalidate } = chamada(fetchFalso);
    expect(url.pathname).toBe("/3/search/movie");
    expect(url.searchParams.get("query")).toBe("clube da luta");
    expect(url.searchParams.get("region")).toBe("BR");
    expect(url.searchParams.get("include_adult")).toBe("false");
    expect(revalidate).toBe(6 * 3600);
  });

  it("devolve página vazia sem chamar a API quando o texto é vazio", async () => {
    const { api, fetchFalso } = montar(paginaTmdb([]));
    expect(await api.buscarFilmes("   ")).toEqual({
      itens: [],
      pagina: 1,
      totalPaginas: 0,
      totalResultados: 0,
    });
    expect(fetchFalso).not.toHaveBeenCalled();
  });
});
