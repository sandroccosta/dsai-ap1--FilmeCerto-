import { describe, expect, it } from "vitest";

import { deLinha, paraLinha } from "@/features/preferencias/linha";
import type { PreferenciasInput } from "@/features/preferencias/schema";

const preferencias: PreferenciasInput = {
  generos: [28, 18],
  generosEvitados: [27],
  duracao: "media",
  frequencia: "semanal",
  streamings: [8, 119],
};

const linha: Parameters<typeof deLinha>[0] = {
  generos: [28, 18],
  generos_evitados: [27],
  duracao: "media",
  frequencia: "semanal",
  streamings: [8, 119],
};

describe("conversão entre preferências e a linha do banco", () => {
  it("paraLinha usa os nomes de coluna do banco", () => {
    expect(paraLinha(preferencias)).toEqual(linha);
  });

  it("deLinha volta para os nomes do schema", () => {
    expect(deLinha(linha)).toEqual(preferencias);
  });
});
