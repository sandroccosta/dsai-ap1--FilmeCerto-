import "server-only";

import type { z } from "zod";

import { clienteTmdbPadrao, TmdbErro, type ClienteTmdb, type Parametros } from "@/lib/tmdb/cliente";
import {
  detalhesTmdb,
  filmeTmdb,
  paginaTmdb,
  type DetalhesTmdb,
  type FilmeTmdb,
} from "@/lib/tmdb/esquemas";
import type {
  FilmeDetalhes,
  FilmeResumo,
  FiltrosDescoberta,
  OrdemDescoberta,
  Pagina,
  Provedor,
} from "@/lib/tmdb/tipos";

const HORA = 3600;
const CACHE_LISTAS = 6 * HORA;
const CACHE_FILME = 24 * HORA;
const MAX_ELENCO = 10;
const MAX_PAGINA = 500;

const ORDENS: Record<OrdemDescoberta, string> = {
  popularidade: "popularity.desc",
  nota: "vote_average.desc",
  lancamento: "primary_release_date.desc",
};

const PAGINA_VAZIA: Pagina<never> = { itens: [], pagina: 1, totalPaginas: 0, totalResultados: 0 };

function validar<T extends z.ZodType>(esquema: T, dados: unknown): z.infer<T> {
  const resultado = esquema.safeParse(dados);
  if (!resultado.success) throw new TmdbErro("Resposta inesperada do TMDB", null);
  return resultado.data;
}

function limitarPagina(pagina = 1) {
  return Math.min(Math.max(Math.trunc(pagina), 1), MAX_PAGINA);
}

function anoDe(data: string | null): number | null {
  const ano = Number(data?.slice(0, 4));
  return ano > 0 ? ano : null;
}

function paraResumo(filme: FilmeTmdb): FilmeResumo {
  return {
    id: filme.id,
    titulo: filme.title,
    tituloOriginal: filme.original_title,
    sinopse: filme.overview,
    posterPath: filme.poster_path,
    backdropPath: filme.backdrop_path,
    generos: filme.genre_ids,
    ano: anoDe(filme.release_date),
    nota: filme.vote_average,
    votos: filme.vote_count,
    popularidade: filme.popularity,
  };
}

function paraPagina(dados: unknown): Pagina<FilmeResumo> {
  const pagina = validar(paginaTmdb(filmeTmdb), dados);
  return {
    itens: pagina.results.map(paraResumo),
    pagina: pagina.page,
    totalPaginas: pagina.total_pages,
    totalResultados: pagina.total_results,
  };
}

function trailerDe(videos: DetalhesTmdb["videos"]["results"]): string | null {
  const trailers = videos.filter((video) => video.site === "YouTube" && video.type === "Trailer");
  return (trailers.find((video) => video.official) ?? trailers[0])?.key ?? null;
}

function paraProvedores(
  lista: { provider_id: number; provider_name: string; logo_path: string | null }[],
): Provedor[] {
  return lista.map((p) => ({ id: p.provider_id, nome: p.provider_name, logoPath: p.logo_path }));
}

function paraDetalhes(filme: DetalhesTmdb): FilmeDetalhes {
  const brasil = filme["watch/providers"].results.BR;
  return {
    ...paraResumo({ ...filme, genre_ids: [] }),
    generos: filme.genres.map(({ id, name }) => ({ id, nome: name })),
    duracaoMin: filme.runtime || null,
    slogan: filme.tagline,
    trailerYoutube: trailerDe(filme.videos.results),
    elenco: filme.credits.cast.slice(0, MAX_ELENCO).map((pessoa) => ({
      nome: pessoa.name,
      personagem: pessoa.character,
      fotoPath: pessoa.profile_path,
    })),
    direcao: filme.credits.crew.filter((p) => p.job === "Director").map((p) => p.name),
    ondeAssistir: brasil
      ? {
          link: brasil.link,
          assinatura: paraProvedores(brasil.flatrate),
          aluguel: paraProvedores(brasil.rent),
          compra: paraProvedores(brasil.buy),
        }
      : null,
    parecidos: (filme.recommendations?.results ?? []).map(paraResumo),
  };
}

/** Funções de filmes sobre um cliente qualquer; os testes passam um cliente com `fetch` falso. */
export function criarApiFilmes(cliente: ClienteTmdb) {
  return {
    async descobrirFilmes(filtros: FiltrosDescoberta = {}): Promise<Pagina<FilmeResumo>> {
      const provedores = filtros.provedores?.length ? filtros.provedores.join("|") : undefined;
      const parametros: Parametros = {
        with_watch_providers: provedores,
        watch_region: provedores && "BR",
        with_watch_monetization_types: provedores && "flatrate",
        with_genres: filtros.generos?.length ? filtros.generos.join("|") : undefined,
        without_genres: filtros.semGeneros?.length ? filtros.semGeneros.join(",") : undefined,
        "with_runtime.gte": filtros.duracaoMin,
        "with_runtime.lte": filtros.duracaoMax,
        "vote_average.gte": filtros.notaMin,
        "vote_count.gte": filtros.votosMin,
        primary_release_year: filtros.ano,
        sort_by: ORDENS[filtros.ordem ?? "popularidade"],
        page: limitarPagina(filtros.pagina),
        region: "BR",
        include_adult: false,
      };
      return paraPagina(await cliente.requisitar("/discover/movie", parametros, CACHE_LISTAS));
    },

    async obterFilme(id: number): Promise<FilmeDetalhes | null> {
      try {
        const dados = await cliente.requisitar(
          `/movie/${id}`,
          { append_to_response: "videos,credits,watch/providers,recommendations" },
          CACHE_FILME,
        );
        return paraDetalhes(validar(detalhesTmdb, dados));
      } catch (erro) {
        if (erro instanceof TmdbErro && erro.status === 404) return null;
        throw erro;
      }
    },

    async recomendacoesDe(id: number, pagina = 1): Promise<Pagina<FilmeResumo>> {
      const dados = await cliente.requisitar(
        `/movie/${id}/recommendations`,
        { page: limitarPagina(pagina) },
        CACHE_FILME,
      );
      return paraPagina(dados);
    },

    async buscarFilmes(texto: string, pagina = 1): Promise<Pagina<FilmeResumo>> {
      const consulta = texto.trim();
      if (!consulta) return PAGINA_VAZIA;
      const dados = await cliente.requisitar(
        "/search/movie",
        { query: consulta, page: limitarPagina(pagina), region: "BR", include_adult: false },
        CACHE_LISTAS,
      );
      return paraPagina(dados);
    },
  };
}

export type ApiFilmes = ReturnType<typeof criarApiFilmes>;

let padrao: ApiFilmes | undefined;
const api = () => (padrao ??= criarApiFilmes(clienteTmdbPadrao()));

export const descobrirFilmes: ApiFilmes["descobrirFilmes"] = (...args) =>
  api().descobrirFilmes(...args);
export const obterFilme: ApiFilmes["obterFilme"] = (...args) => api().obterFilme(...args);
export const recomendacoesDe: ApiFilmes["recomendacoesDe"] = (...args) =>
  api().recomendacoesDe(...args);
export const buscarFilmes: ApiFilmes["buscarFilmes"] = (...args) => api().buscarFilmes(...args);
