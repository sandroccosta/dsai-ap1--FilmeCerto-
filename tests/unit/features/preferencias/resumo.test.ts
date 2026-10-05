import { describe, expect, it } from "vitest";

import { resumirPreferencias } from "@/features/preferencias/resumo";

describe("resumirPreferencias", () => {
  it("lista os gêneros na ordem da constante, com duração e frequência", () => {
    expect(
      resumirPreferencias({ generos: [18, 28], duracao: "media", frequencia: "semanal" }),
    ).toBe("Ação, Drama · Médios (90 a 120 min) · Toda semana");
  });

  it("ignora IDs desconhecidos", () => {
    expect(
      resumirPreferencias({ generos: [27, 999], duracao: "indiferente", frequencia: "diaria" }),
    ).toBe("Terror · Tanto faz · Quase todo dia");
  });
});
