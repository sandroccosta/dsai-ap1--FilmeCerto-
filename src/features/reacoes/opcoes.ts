import type { Database } from "@/lib/supabase/database.types";

export type Reacao = Database["public"]["Enums"]["reacao_filme"];

/** Ordem de exibição dos botões. */
export const REACOES = ["nao-gostei", "gostei", "amei"] as const satisfies Reacao[];

export const ROTULOS_REACAO: Record<Reacao, string> = {
  "nao-gostei": "Não é pra mim",
  gostei: "Gostei",
  amei: "Amei",
};

/** "Porque você amou X" / "Porque você gostou de X". */
export const VERBO_REACAO: Record<
  Exclude<Reacao, "nao-gostei">,
  { titulo: string; motivo: string }
> = {
  amei: { titulo: "Porque você amou", motivo: "que você amou" },
  gostei: { titulo: "Porque você gostou de", motivo: "que você gostou" },
};
