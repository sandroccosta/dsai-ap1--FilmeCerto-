import { z } from "zod";

import { REACOES } from "@/features/reacoes/opcoes";

export const tmdbIdSchema = z.number().int().positive();

export const reacaoSchema = z.object({
  tmdbId: tmdbIdSchema,
  reacao: z.enum(REACOES),
});
