import { z } from "zod";

import { STATUS_LISTA } from "@/features/listas/opcoes";
import { tmdbIdSchema } from "@/features/reacoes/schema";

export const listaSchema = z.object({
  tmdbId: tmdbIdSchema,
  status: z.enum(STATUS_LISTA),
});
