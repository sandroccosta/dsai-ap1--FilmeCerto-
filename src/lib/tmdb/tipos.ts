export type FilmeResumo = {
  id: number;
  titulo: string;
  tituloOriginal: string;
  sinopse: string;
  posterPath: string | null;
  backdropPath: string | null;
  /** IDs de gênero do TMDB. */
  generos: number[];
  ano: number | null;
  nota: number;
  votos: number;
  popularidade: number;
};

export type Pagina<T> = {
  itens: T[];
  pagina: number;
  totalPaginas: number;
  totalResultados: number;
};

export type Provedor = { id: number; nome: string; logoPath: string | null };

export type OndeAssistir = {
  link: string;
  assinatura: Provedor[];
  aluguel: Provedor[];
  compra: Provedor[];
};

export type MembroElenco = { nome: string; personagem: string; fotoPath: string | null };

export type FilmeDetalhes = Omit<FilmeResumo, "generos"> & {
  generos: { id: number; nome: string }[];
  duracaoMin: number | null;
  slogan: string | null;
  /** Key do vídeo no YouTube. */
  trailerYoutube: string | null;
  elenco: MembroElenco[];
  direcao: string[];
  ondeAssistir: OndeAssistir | null;
  parecidos: FilmeResumo[];
};

export type OrdemDescoberta = "popularidade" | "nota" | "lancamento";

export type FiltrosDescoberta = {
  /** Qualquer um destes gêneros. */
  generos?: number[];
  semGeneros?: number[];
  /** Disponível por assinatura em algum destes provedores (watch_region=BR). */
  provedores?: number[];
  duracaoMin?: number;
  duracaoMax?: number;
  notaMin?: number;
  votosMin?: number;
  /** Ano de lançamento (primary_release_year). */
  ano?: number;
  ordem?: OrdemDescoberta;
  pagina?: number;
};
