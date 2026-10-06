import type { PreferenciasInput } from "@/features/preferencias/schema";
import type { Database } from "@/lib/supabase/database.types";

type Linha = Pick<
  Database["public"]["Tables"]["preferencias"]["Row"],
  "generos" | "generos_evitados" | "duracao" | "frequencia" | "streamings"
>;

/** Colunas de `preferencias` que guardam as escolhas da pessoa. */
export const COLUNAS_PREFERENCIAS = "generos, generos_evitados, duracao, frequencia, streamings";

export function paraLinha(preferencias: PreferenciasInput): Linha {
  return {
    generos: preferencias.generos,
    generos_evitados: preferencias.generosEvitados,
    duracao: preferencias.duracao,
    frequencia: preferencias.frequencia,
    streamings: preferencias.streamings,
  };
}

export function deLinha(linha: Linha): PreferenciasInput {
  return {
    generos: linha.generos,
    generosEvitados: linha.generos_evitados,
    duracao: linha.duracao,
    frequencia: linha.frequencia,
    streamings: linha.streamings,
  };
}
