import "server-only";

import { cache } from "react";

import { COLUNAS_PREFERENCIAS, deLinha } from "@/features/preferencias/linha";
import type { PreferenciasInput } from "@/features/preferencias/schema";
import { createClient } from "@/lib/supabase/server";

/** Preferências do usuário logado, ou `null` se ele ainda não fez o onboarding. */
export const obterPreferencias = cache(async (): Promise<PreferenciasInput | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("preferencias")
    .select(COLUNAS_PREFERENCIAS)
    .maybeSingle();

  if (error) {
    console.error("[preferencias] falha ao ler:", error.code, error.message);
    throw new Error("Não foi possível carregar suas preferências.");
  }
  return data && deLinha(data);
});
