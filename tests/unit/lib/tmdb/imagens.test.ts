import { describe, expect, it } from "vitest";

import { urlImagem } from "@/lib/tmdb/imagens";

describe("urlImagem", () => {
  it("monta a URL do CDN de imagens do TMDB", () => {
    expect(urlImagem("/abc.jpg", "w342")).toBe("https://image.tmdb.org/t/p/w342/abc.jpg");
  });

  it("devolve null sem caminho", () => {
    expect(urlImagem(null, "w342")).toBeNull();
  });
});
