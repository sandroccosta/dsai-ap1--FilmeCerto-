/**
 * Gêneros de filme do TMDB (`/genre/movie/list?language=pt-BR`), em ordem alfabética.
 * A lista quase nunca muda; `tests/integration/preferencias/generos-tmdb.test.ts`
 * confere a constante contra a API.
 */
export const GENEROS = [
  { id: 28, nome: "Ação" },
  { id: 16, nome: "Animação" },
  { id: 12, nome: "Aventura" },
  { id: 10770, nome: "Cinema TV" },
  { id: 35, nome: "Comédia" },
  { id: 80, nome: "Crime" },
  { id: 99, nome: "Documentário" },
  { id: 18, nome: "Drama" },
  { id: 10751, nome: "Família" },
  { id: 14, nome: "Fantasia" },
  { id: 37, nome: "Faroeste" },
  { id: 878, nome: "Ficção científica" },
  { id: 10752, nome: "Guerra" },
  { id: 36, nome: "História" },
  { id: 9648, nome: "Mistério" },
  { id: 10402, nome: "Música" },
  { id: 10749, nome: "Romance" },
  { id: 27, nome: "Terror" },
  { id: 53, nome: "Thriller" },
] as const;

export type Genero = (typeof GENEROS)[number];

export const IDS_GENEROS: ReadonlySet<number> = new Set(GENEROS.map((genero) => genero.id));

export const MAX_GENEROS = 5;
