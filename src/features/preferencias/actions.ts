"use server";

import { redirect } from "next/navigation";

import { preferenciasSchema } from "@/features/preferencias/schema";
import { createClient } from "@/lib/supabase/server";

export type EstadoPreferencias = { mensagem?: string };

const ERRO_GENERICO = "Não foi possível salvar agora. Tente de novo.";

export async function salvarPreferencias(
  _anterior: EstadoPreferencias,
  formData: FormData,
): Promise<EstadoPreferencias> {
  const resultado = preferenciasSchema.safeParse({
    generos: formData.getAll("generos").map(Number),
    duracao: formData.get("duracao"),
    frequencia: formData.get("frequencia"),
  });
  if (!resultado.success) {
    return { mensagem: resultado.error.issues[0]?.message ?? ERRO_GENERICO };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=%2Fonboarding");

  const { error } = await supabase
    .from("preferencias")
    .upsert({ usuario_id: user.id, ...resultado.data });
  if (error) {
    console.error("[preferencias] falha ao salvar:", error.code, error.message);
    return { mensagem: ERRO_GENERICO };
  }

  redirect("/dashboard");
}
