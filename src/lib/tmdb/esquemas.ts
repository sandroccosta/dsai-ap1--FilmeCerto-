import { z } from "zod";

/** Strings que o TMDB às vezes manda como `null` ou omite. */
const textoOpcional = z
  .string()
  .nullish()
  .transform((valor) => valor || null);

const textoOuVazio = z
  .string()
  .nullish()
  .transform((valor) => valor ?? "");

const numero = z
  .number()
  .nullish()
  .transform((valor) => valor ?? 0);

const baseFilme = {
  id: z.number().int(),
  title: z.string(),
  original_title: textoOuVazio,
  overview: textoOuVazio,
  poster_path: textoOpcional,
  backdrop_path: textoOpcional,
  release_date: textoOpcional,
  vote_average: numero,
  vote_count: numero,
  popularity: numero,
};

export const filmeTmdb = z.object({ ...baseFilme, genre_ids: z.array(z.number()).default([]) });

export function paginaTmdb<T extends z.ZodType>(item: T) {
  return z.object({
    page: z.number().int(),
    results: z.array(item),
    total_pages: z.number().int(),
    total_results: z.number().int(),
  });
}

const provedorTmdb = z.object({
  provider_id: z.number().int(),
  provider_name: z.string(),
  logo_path: textoOpcional,
});

export const detalhesTmdb = z.object({
  ...baseFilme,
  genres: z.array(z.object({ id: z.number().int(), name: z.string() })).default([]),
  runtime: z.number().nullish(),
  tagline: textoOpcional,
  videos: z
    .object({
      results: z.array(
        z.object({
          key: z.string(),
          site: z.string(),
          type: z.string(),
          official: z.boolean().default(false),
        }),
      ),
    })
    .default({ results: [] }),
  credits: z
    .object({
      cast: z.array(
        z.object({ name: z.string(), character: textoOuVazio, profile_path: textoOpcional }),
      ),
      crew: z.array(z.object({ name: z.string(), job: z.string() })),
    })
    .default({ cast: [], crew: [] }),
  "watch/providers": z
    .object({
      results: z.record(
        z.string(),
        z.object({
          link: z.string(),
          flatrate: z.array(provedorTmdb).default([]),
          rent: z.array(provedorTmdb).default([]),
          buy: z.array(provedorTmdb).default([]),
        }),
      ),
    })
    .default({ results: {} }),
  recommendations: paginaTmdb(filmeTmdb).optional(),
});

export type FilmeTmdb = z.infer<typeof filmeTmdb>;
export type DetalhesTmdb = z.infer<typeof detalhesTmdb>;
