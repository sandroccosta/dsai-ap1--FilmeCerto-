import type { Database } from "@/lib/supabase/database.types";

export type Duracao = Database["public"]["Enums"]["duracao_preferida"];
export type Frequencia = Database["public"]["Enums"]["frequencia_assistir"];

export const DURACOES = ["curta", "media", "longa", "indiferente"] as const satisfies Duracao[];
export const FREQUENCIAS = [
  "raramente",
  "mensal",
  "semanal",
  "diaria",
] as const satisfies Frequencia[];

export const ROTULOS_DURACAO: Record<Duracao, string> = {
  curta: "Curtos (até 90 min)",
  media: "Médios (90 a 120 min)",
  longa: "Longos (mais de 120 min)",
  indiferente: "Tanto faz",
};

export const ROTULOS_FREQUENCIA: Record<Frequencia, string> = {
  raramente: "Raramente (menos de um por mês)",
  mensal: "Algumas vezes por mês",
  semanal: "Toda semana",
  diaria: "Quase todo dia",
};
