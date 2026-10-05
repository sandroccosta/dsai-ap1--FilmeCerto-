"use server";

import { revalidatePath } from "next/cache";

import { listaSchema } from "@/features/listas/schema";
import { createClient } from "@/lib/supabase/server";
import { obterFilme } from "@/lib/tmdb/filmes";

export type EstadoLista = { mensagem?: string };

const ERRO_GENERICO = "Não foi possível atualizar sua lista agora. Tente de novo.";

/**
 * Põe o filme na lista pedida; se ele já estava nela, tira (clicar de novo desfaz).
 * Os dados do filme vêm do TMDB no servidor, não do navegador.
 */
export async function alternarLista(
  _anterior: EstadoLista,
  formData: FormData,
): Promise<EstadoLista> {
  const resultado = listaSchema.safeParse({
    tmdbId: Number(formData.get("tmdbId")),
    status: formData.get("status"),
  });
  if (!resultado.success) return { mensagem: ERRO_GENERICO };
  const { tmdbId, status } = resultado.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { mensagem: "Sua sessão expirou. Entre de novo." };

  const { data: atual } = await supabase
    .from("lista_itens")
    .select("status")
    .eq("tmdb_id", tmdbId)
    .maybeSingle();

  if (atual?.status === status) {
    const { error } = await supabase.from("lista_itens").delete().eq("tmdb_id", tmdbId);
    if (error) {
      console.error("[listas] falha ao remover:", error.code, error.message);
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

    const { error } = await supabase.from("lista_itens").upsert({
      usuario_id: user.id,
      tmdb_id: tmdbId,
      status,
      titulo: filme.titulo,
      poster_path: filme.posterPath,
      ano: filme.ano,
      generos: filme.generos.map((genero) => genero.id),
      // Ao entrar ou trocar de lista, o filme vai para o topo da aba.
      adicionado_em: new Date().toISOString(),
    });
    if (error) {
      console.error("[listas] falha ao salvar:", error.code, error.message);
      return { mensagem: ERRO_GENERICO };
    }
  }

  revalidatePath(`/filme/${tmdbId}`);
  revalidatePath("/listas");
  revalidatePath("/dashboard");
  return {};
}
