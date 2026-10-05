import type { FilmeResumo } from "@/lib/tmdb/tipos";

/** Filme mínimo para os testes do motor. */
export function filme(id: number, sobrescrever: Partial<FilmeResumo> = {}): FilmeResumo {
  return {
    id,
    titulo: `Filme ${id}`,
    tituloOriginal: `Film ${id}`,
    sinopse: "",
    posterPath: null,
    backdropPath: null,
    generos: [18],
    ano: 2020,
    nota: 7,
    votos: 1000,
    popularidade: 50,
    ...sobrescrever,
  };
}

/** Gerador "aleatório" fixo, para testes que não dependem do sorteio. */
export const geradorFixo =
  (valor = 0) =>
  () =>
    valor;
