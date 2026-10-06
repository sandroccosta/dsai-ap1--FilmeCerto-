"use server";

import { idsNasListas } from "@/features/listas/consultas";
import { obterPreferencias } from "@/features/preferencias/consultas";
import { obterReacoes } from "@/features/reacoes/consultas";
import { limparIds } from "@/features/surpresa/memoria";
import { montarGlobo, type FilmeGlobo } from "@/features/surpresa/montar";
import { createClient } from "@/lib/supabase/server";
import { descobrirFilmes } from "@/lib/tmdb/filmes";

/** Lote novo para o globo, sem os filmes que a pessoa já viu, reagiu ou sorteou. */
export async function novoGlobo(jaVistos: unknown): Promise<FilmeGlobo[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  try {
    const preferencias = await obterPreferencias();
    if (!preferencias) return [];
    const [reacoes, nasListas] = await Promise.all([obterReacoes(), idsNasListas()]);

    return await montarGlobo({
      preferencias,
      excluir: [...nasListas, ...reacoes.map((r) => r.tmdbId), ...limparIds(jaVistos)],
      api: { descobrirFilmes },
    });
  } catch (erro) {
    console.error("[surpresa] falha ao renovar o globo:", erro);
    return [];
  }
}
