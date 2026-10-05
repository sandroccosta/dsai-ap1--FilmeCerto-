"use server";

import { revalidatePath } from "next/cache";

import { reacaoSchema } from "@/features/reacoes/schema";
import { createClient } from "@/lib/supabase/server";
import { obterFilme } from "@/lib/tmdb/filmes";

export type EstadoReacao = { mensagem?: string };

const ERRO_GENERICO = "Não foi possível salvar sua reação agora. Tente de novo.";

/**
 * Marca a reação ao filme; se ela já era a atual, remove (clicar de novo desfaz).
 * Título e gêneros vêm do TMDB no servidor, não do navegador.
 */
export async function alternarReacao(
  _anterior: EstadoReacao,
  formData: FormData,
): Promise<EstadoReacao> {
  const resultado = reacaoSchema.safeParse({
    tmdbId: Number(formData.get("tmdbId")),
    reacao: formData.get("reacao"),
  });
  if (!resultado.success) return { mensagem: ERRO_GENERICO };
  const { tmdbId, reacao } = resultado.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { mensagem: "Sua sessão expirou. Entre de novo." };

  const { data: atual } = await supabase
    .from("reacoes")
    .select("reacao")
    .eq("tmdb_id", tmdbId)
    .maybeSingle();

  if (atual?.reacao === reacao) {
    const { error } = await supabase.from("reacoes").delete().eq("tmdb_id", tmdbId);
    if (error) {
      console.error("[reacoes] falha ao remover:", error.code, error.message);
      return { mensagem: ERRO_GENERICO };
    }
  } else {
    let filme;
    try {
      filme = await obterFilme(tmdbId);
    } catch {
      return { mensagem: ERRO_GENERICO };
    }
    if (!filme) return { mensagem: "Filme não encontrado." };

    const { error } = await supabase.from("reacoes").upsert({
      usuario_id: user.id,
      tmdb_id: tmdbId,
      reacao,
      titulo: filme.titulo,
      generos: filme.generos.map((genero) => genero.id),
    });
    if (error) {
      console.error("[reacoes] falha ao salvar:", error.code, error.message);
      return { mensagem: ERRO_GENERICO };
    }
  }

  revalidatePath(`/filme/${tmdbId}`);
  revalidatePath("/dashboard");
  return {};
}
