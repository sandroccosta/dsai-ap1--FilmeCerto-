import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

export type UsuarioAtual = {
  id: string;
  email: string;
  nome: string;
};

/**
 * Usuário autenticado na requisição atual, com o nome do perfil, ou `null`.
 * Memoizado por renderização, então header e página compartilham uma só consulta.
 */
export const obterUsuarioAtual = cache(async (): Promise<UsuarioAtual | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: perfil } = await supabase
    .from("perfis")
    .select("nome")
    .eq("id", user.id)
    .maybeSingle();

  return { id: user.id, email: user.email ?? "", nome: perfil?.nome ?? "" };
});

/** Como `obterUsuarioAtual`, mas manda para o login quando não há sessão. */
export async function exigirUsuario(): Promise<UsuarioAtual> {
  const usuario = await obterUsuarioAtual();
  if (!usuario) redirect("/login");
  return usuario;
}
