import type { Database } from "@/lib/supabase/database.types";

export type StatusLista = Database["public"]["Enums"]["status_lista"];

export const STATUS_LISTA = ["quero_assistir", "assistido"] as const satisfies StatusLista[];

export const ROTULOS_STATUS: Record<StatusLista, string> = {
  quero_assistir: "Quero assistir",
  assistido: "Já assisti",
};

export type Aba = "quero" | "assistidos";

export const STATUS_DA_ABA: Record<Aba, StatusLista> = {
  quero: "quero_assistir",
  assistidos: "assistido",
};
