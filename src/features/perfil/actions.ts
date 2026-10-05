"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { nomeSchema } from "@/features/auth/schema";
import { preferenciasSchema } from "@/features/preferencias/schema";
import { createClient } from "@/lib/supabase/server";

export type EstadoPerfil = {
  ok?: boolean;
  /** Erro do campo nome (formulário de dados). */
  erroNome?: string;
  /** Erro geral do formulário. */
  mensagem?: string;
};

const ERRO_GENERICO = "Não foi possível salvar agora. Tente de novo.";

async function usuarioLogado() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function atualizarNome(
  _anterior: EstadoPerfil,
  formData: FormData,
): Promise<EstadoPerfil> {
  const resultado = z.object({ nome: nomeSchema }).safeParse({ nome: formData.get("nome") ?? "" });
  if (!resultado.success) return { erroNome: resultado.error.issues[0]?.message };

  const { supabase, user } = await usuarioLogado();
  if (!user) return { mensagem: "Sua sessão expirou. Entre de novo." };

  const { error } = await supabase
    .from("perfis")
    .update({ nome: resultado.data.nome })
    .eq("id", user.id);
  if (error) {
    console.error("[perfil] falha ao salvar nome:", error.code, error.message);
    return { mensagem: ERRO_GENERICO };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function atualizarPreferencias(
  _anterior: EstadoPerfil,
  formData: FormData,
): Promise<EstadoPerfil> {
  const resultado = preferenciasSchema.safeParse({
    generos: formData.getAll("generos").map(Number),
    duracao: formData.get("duracao"),
    frequencia: formData.get("frequencia"),
  });
  if (!resultado.success) return { mensagem: resultado.error.issues[0]?.message ?? ERRO_GENERICO };

  const { supabase, user } = await usuarioLogado();
  if (!user) return { mensagem: "Sua sessão expirou. Entre de novo." };

  const { error } = await supabase
    .from("preferencias")
    .update(resultado.data)
    .eq("usuario_id", user.id);
  if (error) {
    console.error("[perfil] falha ao salvar preferências:", error.code, error.message);
    return { mensagem: ERRO_GENERICO };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
