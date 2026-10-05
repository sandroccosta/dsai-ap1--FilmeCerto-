import type { Duracao, Frequencia } from "@/features/preferencias/opcoes";
import type { FiltrosDescoberta } from "@/lib/tmdb/tipos";

export function filtrosDeDuracao(
  duracao: Duracao,
): Pick<FiltrosDescoberta, "duracaoMin" | "duracaoMax"> {
  switch (duracao) {
    case "curta":
      return { duracaoMax: 90 };
    case "media":
      return { duracaoMin: 90, duracaoMax: 120 };
    case "longa":
      return { duracaoMin: 120 };
    case "indiferente":
      return {};
  }
}

/**
 * Quanto mais a pessoa assiste, menos óbvios os filmes: menos votos e nota mínimos
 * e páginas mais fundas do TMDB. Quem assiste pouco recebe os consagrados.
 */
export const PERFIS: Record<Frequencia, { votosMin: number; notaMin: number; paginaMax: number }> =
  {
    raramente: { votosMin: 2000, notaMin: 7, paginaMax: 2 },
    mensal: { votosMin: 1000, notaMin: 6.5, paginaMax: 3 },
    semanal: { votosMin: 300, notaMin: 6.5, paginaMax: 5 },
    diaria: { votosMin: 100, notaMin: 6, paginaMax: 10 },
  };
