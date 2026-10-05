import { z } from "zod";

import { IDS_GENEROS, MAX_GENEROS } from "@/features/preferencias/generos";
import { DURACOES, FREQUENCIAS } from "@/features/preferencias/opcoes";

export const MENSAGENS = {
  generos: "Escolha de 1 a 5 gêneros.",
  duracao: "Escolha uma duração.",
  frequencia: "Escolha uma frequência.",
} as const;

export const generosSchema = z
  .array(z.number({ error: MENSAGENS.generos }).int({ error: MENSAGENS.generos }), {
    error: MENSAGENS.generos,
  })
  .min(1, { error: MENSAGENS.generos })
  .max(MAX_GENEROS, { error: MENSAGENS.generos })
  .refine((ids) => ids.every((id) => IDS_GENEROS.has(id)), { error: MENSAGENS.generos })
  .refine((ids) => new Set(ids).size === ids.length, { error: MENSAGENS.generos });

export const preferenciasSchema = z.object({
  generos: generosSchema,
  duracao: z.enum(DURACOES, { error: MENSAGENS.duracao }),
  frequencia: z.enum(FREQUENCIAS, { error: MENSAGENS.frequencia }),
});

export type PreferenciasInput = z.infer<typeof preferenciasSchema>;
