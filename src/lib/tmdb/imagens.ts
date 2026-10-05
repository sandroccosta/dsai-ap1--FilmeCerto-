export type TamanhoImagem = "w92" | "w185" | "w342" | "w500" | "w780" | "w1280" | "original";

/** URL do CDN de imagens do TMDB. Pode ser usado no servidor e no navegador. */
export function urlImagem(path: string | null, tamanho: TamanhoImagem): string | null {
  return path ? `https://image.tmdb.org/t/p/${tamanho}${path}` : null;
}
