import "server-only";

import { cache } from "react";

import type { StatusLista } from "@/features/listas/opcoes";
import type { Reacao } from "@/features/reacoes/opcoes";
import { createClient } from "@/lib/supabase/server";

export type ItemLista = {
  tmdbId: number;
  status: StatusLista;
  titulo: string;
  posterPath: string | null;
  ano: number | null;
  /** Reação dada ao filme, se houver (spec `reacoes`). */
  reacao: Reacao | null;
};

/** Itens das duas listas do usuário logado, do mais recente para o mais antigo. */
export const obterItensLista = cache(async (): Promise<ItemLista[]> => {
  const supabase = await createClient();
  const [itens, reacoes] = await Promise.all([
    supabase
      .from("lista_itens")
      .select("tmdb_id, status, titulo, poster_path, ano")
      .order("adicionado_em", { ascending: false }),
    supabase.from("reacoes").select("tmdb_id, reacao"),
  ]);

  if (itens.error) {
    console.error("[listas] falha ao ler:", itens.error.code, itens.error.message);
    throw new Error("Não foi possível carregar suas listas.");
  }
  const reacaoPorFilme = new Map((reacoes.data ?? []).map((r) => [r.tmdb_id, r.reacao]));

  return itens.data.map((linha) => ({
    tmdbId: linha.tmdb_id,
    status: linha.status,
    titulo: linha.titulo,
    posterPath: linha.poster_path,
    ano: linha.ano,
    reacao: reacaoPorFilme.get(linha.tmdb_id) ?? null,
  }));
});

/** IDs dos filmes nas duas listas, para o motor não recomendá-los. */
export async function idsNasListas(): Promise<number[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("lista_itens").select("tmdb_id");
  if (error) {
    console.error("[listas] falha ao ler IDs:", error.code, error.message);
    return [];
  }
  return data.map((linha) => linha.tmdb_id);
}

/** Lista em que o filme está, ou `null`. */
export async function obterStatusLista(tmdbId: number): Promise<StatusLista | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("lista_itens")
    .select("status")
    .eq("tmdb_id", tmdbId)
    .maybeSingle();
  return data?.status ?? null;
}
