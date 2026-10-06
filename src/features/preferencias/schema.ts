import { z } from "zod";

import { IDS_GENEROS, MAX_GENEROS } from "@/features/preferencias/generos";
import { DURACOES, FREQUENCIAS } from "@/features/preferencias/opcoes";
import { IDS_STREAMINGS, MAX_STREAMINGS } from "@/features/preferencias/streamings";

export const MENSAGENS = {
  generos: "Escolha de 1 a 5 gêneros.",
  generosEvitados: "Escolha até 5 gêneros para evitar, diferentes dos favoritos.",
  duracao: "Escolha uma duração.",
  frequencia: "Escolha uma frequência.",
  streamings: "Escolha streamings da lista.",
  amados: "Escolha até 5 filmes que você ama.",
  rejeitados: "Escolha até 5 filmes que você não assistiria.",
} as const;

export const MAX_FILMES_ONBOARDING = 5;

/** Páginas do TMDB que o botão "Mostrar outros filmes" percorre antes de voltar à 1ª. */
export const MAX_PAGINA_SUGESTOES = 5;

/** Lista de IDs inteiros, sem repetição, com no máximo `max` itens; todos os erros dão `mensagem`. */
function listaDeIds(mensagem: string, max: number, valido: (id: number) => boolean) {
  return z
    .array(z.number({ error: mensagem }).int({ error: mensagem }), { error: mensagem })
    .max(max, { error: mensagem })
    .refine((ids) => ids.every(valido), { error: mensagem })
    .refine((ids) => new Set(ids).size === ids.length, { error: mensagem });
}

export const generosSchema = listaDeIds(MENSAGENS.generos, MAX_GENEROS, (id) =>
  IDS_GENEROS.has(id),
).refine((ids) => ids.length > 0, { error: MENSAGENS.generos });

export const generosEvitadosSchema = listaDeIds(MENSAGENS.generosEvitados, MAX_GENEROS, (id) =>
  IDS_GENEROS.has(id),
);

export const streamingsSchema = listaDeIds(MENSAGENS.streamings, MAX_STREAMINGS, (id) =>
  IDS_STREAMINGS.has(id),
);

export const preferenciasSchema = z
  .object({
    generos: generosSchema,
    generosEvitados: generosEvitadosSchema.default([]),
    duracao: z.enum(DURACOES, { error: MENSAGENS.duracao }),
    frequencia: z.enum(FREQUENCIAS, { error: MENSAGENS.frequencia }),
    streamings: streamingsSchema.default([]),
  })
  .refine(({ generos, generosEvitados }) => !generosEvitados.some((id) => generos.includes(id)), {
    error: MENSAGENS.generosEvitados,
    path: ["generosEvitados"],
  });

export type PreferenciasInput = z.infer<typeof preferenciasSchema>;

const filmesSchema = (mensagem: string) =>
  listaDeIds(mensagem, MAX_FILMES_ONBOARDING, (id) => id > 0).default([]);

/** Preferências mais os filmes amados e os rejeitados "pela capa" no onboarding. */
export const onboardingSchema = preferenciasSchema
  .safeExtend({
    amados: filmesSchema(MENSAGENS.amados),
    rejeitados: filmesSchema(MENSAGENS.rejeitados),
  })
  .refine(({ amados, rejeitados }) => !rejeitados.some((id) => amados.includes(id)), {
    error: MENSAGENS.rejeitados,
    path: ["rejeitados"],
  });

export type OnboardingInput = z.infer<typeof onboardingSchema>;
