"use server";

import { z } from "zod";

import { IDS_GENEROS } from "@/features/preferencias/generos";
import { MAX_PAGINA_SUGESTOES } from "@/features/preferencias/schema";
import { createClient } from "@/lib/supabase/server";
import { buscarFilmes, descobrirFilmes } from "@/lib/tmdb/filmes";
import type { FilmeResumo } from "@/lib/tmdb/tipos";

/** Filme que aparece nas grades de pôsteres do onboarding. */
export type FilmeOpcao = Pick<FilmeResumo, "id" | "titulo" | "ano"> & { posterPath: string };

export type ResultadoFilmes = { filmes: FilmeOpcao[] } | { erro: true };

/** Populares o bastante para a pessoa reconhecer pelo pôster. */
const VOTOS_MIN = 1000;
const MIN_CARACTERES_BUSCA = 2;

const listaDeGeneros = z
  .array(
    z
      .number()
      .int()
      .refine((id) => IDS_GENEROS.has(id)),
  )
  .max(19);
const filtrosSchema = z.object({
  generos: listaDeGeneros.optional(),
  semGeneros: listaDeGeneros.optional(),
  pagina: z.number().int().min(1).max(MAX_PAGINA_SUGESTOES).optional(),
});

async function temSessao() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return Boolean(user);
}

function paraOpcoes(filmes: FilmeResumo[]): FilmeOpcao[] {
  return filmes.flatMap(({ id, titulo, ano, posterPath }) =>
    posterPath ? [{ id, titulo, ano, posterPath }] : [],
  );
}

/**
 * Grade dos passos 6 (com os gêneros favoritos) e 7 (sem os favoritos e os evitados).
 * No passo 7, "Mostrar outros filmes" pede as páginas seguintes.
 */
export async function sugerirFilmesOnboarding(filtros: {
  generos?: number[];
  semGeneros?: number[];
  pagina?: number;
}): Promise<ResultadoFilmes> {
  const validos = filtrosSchema.safeParse(filtros);
  if (!validos.success || !(await temSessao())) return { erro: true };

  try {
    const pagina = await descobrirFilmes({
      generos: validos.data.generos,
      semGeneros: validos.data.semGeneros,
      votosMin: VOTOS_MIN,
      ordem: "popularidade",
      pagina: validos.data.pagina ?? 1,
    });
    return { filmes: paraOpcoes(pagina.itens) };
  } catch (erro) {
    console.error("[onboarding] falha ao sugerir filmes:", erro);
    return { erro: true };
  }
}

/** Busca por nome do passo 6. */
export async function buscarFilmesOnboarding(texto: string): Promise<ResultadoFilmes> {
  const consulta = String(texto).trim();
  if (consulta.length < MIN_CARACTERES_BUSCA) return { filmes: [] };
  if (!(await temSessao())) return { erro: true };

  try {
    return { filmes: paraOpcoes((await buscarFilmes(consulta)).itens) };
  } catch (erro) {
    console.error("[onboarding] falha ao buscar filmes:", erro);
    return { erro: true };
  }
}
