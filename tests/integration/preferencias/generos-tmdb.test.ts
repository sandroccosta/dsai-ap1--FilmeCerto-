import { describe, expect, it } from "vitest";

import { GENEROS } from "@/features/preferencias/generos";

import { TOKEN_TMDB_REAL } from "../../support/tmdb-real";

describe.skipIf(!TOKEN_TMDB_REAL)("gêneros contra o TMDB", () => {
  it("a constante GENEROS é igual à lista de gêneros de filme do TMDB em pt-BR", async () => {
    const resposta = await fetch("https://api.themoviedb.org/3/genre/movie/list?language=pt-BR", {
      headers: { Authorization: `Bearer ${TOKEN_TMDB_REAL}`, accept: "application/json" },
    });
    expect(resposta.status).toBe(200);

    const { genres } = (await resposta.json()) as { genres: { id: number; name: string }[] };
    const doTmdb = genres.map(({ id, name }) => ({ id, nome: name }));
    const ordenar = (lista: { id: number; nome: string }[]) =>
      [...lista].sort((x, y) => x.id - y.id);

    expect(ordenar([...GENEROS])).toEqual(ordenar(doTmdb));
  });
});
