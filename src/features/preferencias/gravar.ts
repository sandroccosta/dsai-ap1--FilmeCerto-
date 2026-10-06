import type { SupabaseClient } from "@supabase/supabase-js";

import { paraLinha } from "@/features/preferencias/linha";
import type { OnboardingInput } from "@/features/preferencias/schema";
import type { Database } from "@/lib/supabase/database.types";
import type { FilmeDetalhes } from "@/lib/tmdb/tipos";

/** Título e gêneros de um filme no TMDB, ou `null` se ele não existe. */
export type BuscarFilme = (id: number) => Promise<Pick<FilmeDetalhes, "titulo" | "generos"> | null>;

/**
 * Grava o onboarding: primeiro as reações dos filmes amados ("Amei") e rejeitados pela capa
 * ("Não é pra mim"), depois a linha de `preferencias`, que marca o onboarding como concluído.
 * Se algo falhar antes dela, a pessoa continua no wizard; repetir não duplica nada.
 */
export async function gravarOnboarding(
  supabase: SupabaseClient<Database>,
  usuarioId: string,
  { amados, rejeitados, ...preferencias }: OnboardingInput,
  buscarFilme: BuscarFilme,
): Promise<"ok" | "erro"> {
  const escolhas = [
    ...amados.map((tmdbId) => ({ tmdbId, reacao: "amei" as const })),
    ...rejeitados.map((tmdbId) => ({ tmdbId, reacao: "nao-gostei" as const })),
  ];

  let filmes;
  try {
    filmes = await Promise.all(escolhas.map(({ tmdbId }) => buscarFilme(tmdbId)));
  } catch (erro) {
    console.error("[onboarding] falha ao buscar filmes no TMDB:", erro);
    return "erro";
  }

  const reacoes = [];
  for (const [indice, { tmdbId, reacao }] of escolhas.entries()) {
    const filme = filmes[indice];
    if (!filme) return "erro";
    reacoes.push({
      usuario_id: usuarioId,
      tmdb_id: tmdbId,
      reacao,
      titulo: filme.titulo,
      generos: filme.generos.map((genero) => genero.id),
    });
  }

  if (reacoes.length > 0) {
    const { error } = await supabase.from("reacoes").upsert(reacoes);
    if (error) {
      console.error("[onboarding] falha ao salvar reações:", error.code, error.message);
      return "erro";
    }
  }

  const { error } = await supabase
    .from("preferencias")
    .upsert({ usuario_id: usuarioId, ...paraLinha(preferencias) });
  if (error) {
    console.error("[onboarding] falha ao salvar preferências:", error.code, error.message);
    return "erro";
  }
  return "ok";
}
