import { IDS_GENEROS } from "@/features/preferencias/generos";
import { DURACOES, type Duracao } from "@/features/preferencias/opcoes";
import { filtrosDeDuracao } from "@/features/recomendacao/perfil";
import type { FiltrosDescoberta, OrdemDescoberta } from "@/lib/tmdb/tipos";

const MAX_TEXTO = 100;
const MAX_PAGINA = 500;
const ANO_MINIMO = 1888;
const VOTOS_MIN_POR_NOTA = 200;
export const MIN_TEXTO = 2;

export const ORDENS = ["popularidade", "nota", "lancamento"] as const satisfies OrdemDescoberta[];

export type Modo = "nome" | "filtros";

export type FiltrosBusca = {
  genero: number | null;
  ano: number | null;
  duracao: Duracao;
  ordem: OrdemDescoberta;
};

export type Busca = { modo: Modo; texto: string; pagina: number; filtros: FiltrosBusca };

type Parametros = Record<string, string | string[] | undefined>;

function texto(valor: string | string[] | undefined): string {
  return typeof valor === "string" ? valor.trim() : "";
}

function inteiro(valor: string | string[] | undefined, min: number, max: number): number | null {
  const bruto = texto(valor);
  if (!/^\d+$/.test(bruto)) return null;
  const numero = Number(bruto);
  return numero >= min && numero <= max ? numero : null;
}

function umDe<T extends string>(
  valor: string | string[] | undefined,
  opcoes: readonly T[],
  padrao: T,
) {
  const bruto = texto(valor);
  return (opcoes as readonly string[]).includes(bruto) ? (bruto as T) : padrao;
}

/** Lê os parâmetros da URL da busca, já validados e com os padrões aplicados. */
export function lerBusca(parametros: Parametros, hoje = new Date()): Busca {
  const genero = inteiro(parametros.genero, 1, Number.MAX_SAFE_INTEGER);
  return {
    modo: texto(parametros.modo) === "filtros" ? "filtros" : "nome",
    texto: texto(parametros.q).replace(/\s+/g, " ").slice(0, MAX_TEXTO),
    pagina: inteiro(parametros.pagina, 1, MAX_PAGINA) ?? 1,
    filtros: {
      genero: genero !== null && IDS_GENEROS.has(genero) ? genero : null,
      ano: inteiro(parametros.ano, ANO_MINIMO, hoje.getFullYear() + 2),
      duracao: umDe(parametros.duracao, DURACOES, "indiferente"),
      ordem: umDe(parametros.ordem, ORDENS, "popularidade"),
    },
  };
}

/** Traduz os filtros da página para a consulta `discover` do TMDB. */
export function filtrosParaDescoberta(filtros: FiltrosBusca, pagina: number): FiltrosDescoberta {
  return {
    ...(filtros.genero !== null && { generos: [filtros.genero] }),
    ...(filtros.ano !== null && { ano: filtros.ano }),
    ...filtrosDeDuracao(filtros.duracao),
    ordem: filtros.ordem,
    // Sem mínimo de votos, "mais bem avaliados" traz filmes de 10★ com 3 votos.
    ...(filtros.ordem === "nota" && { votosMin: VOTOS_MIN_POR_NOTA }),
    pagina,
  };
}

/** Parâmetros que a paginação precisa manter, conforme o modo. */
export function parametrosDaBusca({ modo, texto, filtros }: Busca): Record<string, string> {
  if (modo === "nome") return { q: texto };
  return {
    modo: "filtros",
    ...(filtros.genero !== null && { genero: String(filtros.genero) }),
    ...(filtros.ano !== null && { ano: String(filtros.ano) }),
    ...(filtros.duracao !== "indiferente" && { duracao: filtros.duracao }),
    ...(filtros.ordem !== "popularidade" && { ordem: filtros.ordem }),
  };
}
