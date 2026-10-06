import { describe, expect, it } from "vitest";

import { STREAMINGS } from "@/features/preferencias/streamings";

import { TOKEN_TMDB_REAL } from "../../support/tmdb-real";

describe.skipIf(!TOKEN_TMDB_REAL)("streamings contra o TMDB", () => {
  it("cada serviço da constante STREAMINGS existe no Brasil com o mesmo nome e logo", async () => {
    const resposta = await fetch(
      "https://api.themoviedb.org/3/watch/providers/movie?watch_region=BR&language=pt-BR",
      { headers: { Authorization: `Bearer ${TOKEN_TMDB_REAL}`, accept: "application/json" } },
    );
    expect(resposta.status).toBe(200);

    const { results } = (await resposta.json()) as {
      results: { provider_id: number; provider_name: string; logo_path: string }[];
    };
    const doTmdb = new Map(results.map((p) => [p.provider_id, p]));

    for (const { id, nome, logoPath } of STREAMINGS) {
      const provedor = doTmdb.get(id);
      expect(provedor, `provedor ${id} (${nome})`).toBeDefined();
      expect({ id, nome, logoPath }).toEqual({
        id: provedor?.provider_id,
        nome: provedor?.provider_name,
        logoPath: provedor?.logo_path,
      });
    }
  });
});
