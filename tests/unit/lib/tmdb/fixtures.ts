/** Respostas reduzidas no formato da API do TMDB, para os testes. */

export function filmeTmdb(sobrescrever: Record<string, unknown> = {}) {
  return {
    id: 550,
    title: "Clube da Luta",
    original_title: "Fight Club",
    overview: "Um homem deprimido...",
    poster_path: "/poster.jpg",
    backdrop_path: "/fundo.jpg",
    genre_ids: [18, 53],
    release_date: "1999-10-15",
    vote_average: 8.4,
    vote_count: 30000,
    popularity: 70.5,
    adult: false,
    ...sobrescrever,
  };
}

export function paginaTmdb(resultados: unknown[], pagina = 1) {
  return { page: pagina, results: resultados, total_pages: 3, total_results: 55 };
}

export function detalhesTmdb(sobrescrever: Record<string, unknown> = {}) {
  const base: Record<string, unknown> = filmeTmdb();
  delete base.genre_ids;
  return {
    ...base,
    genres: [
      { id: 18, name: "Drama" },
      { id: 53, name: "Thriller" },
    ],
    runtime: 139,
    tagline: "",
    videos: {
      results: [
        { key: "teaser1", site: "YouTube", type: "Teaser", official: true },
        { key: "naoOficial", site: "YouTube", type: "Trailer", official: false },
        { key: "vimeo1", site: "Vimeo", type: "Trailer", official: true },
        { key: "oficial", site: "YouTube", type: "Trailer", official: true },
      ],
    },
    credits: {
      cast: Array.from({ length: 12 }, (_, i) => ({
        name: `Ator ${i + 1}`,
        character: `Papel ${i + 1}`,
        profile_path: i === 0 ? null : `/ator${i + 1}.jpg`,
        order: i,
      })),
      crew: [
        { name: "David Fincher", job: "Director" },
        { name: "Jim Uhls", job: "Screenplay" },
      ],
    },
    "watch/providers": {
      results: {
        BR: {
          link: "https://www.themoviedb.org/movie/550/watch?locale=BR",
          flatrate: [{ provider_id: 8, provider_name: "Netflix", logo_path: "/netflix.jpg" }],
          rent: [{ provider_id: 2, provider_name: "Apple TV", logo_path: null }],
        },
        US: { link: "https://example.com", buy: [] },
      },
    },
    recommendations: paginaTmdb([filmeTmdb({ id: 807, title: "Se7en" })]),
    ...sobrescrever,
  };
}
