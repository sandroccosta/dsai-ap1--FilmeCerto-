import { describe, expect, it } from "vitest";

import { DESTINO_PADRAO, sanitizarNext } from "@/features/auth/redirecionamento";

describe("sanitizarNext", () => {
  it.each(["/filme/1", "/dashboard?x=1", "/dashboard"])(
    "aceita o caminho interno %s",
    (caminho) => {
      expect(sanitizarNext(caminho)).toBe(caminho);
    },
  );

  it.each([
    "//evil.com",
    "https://evil.com",
    "/\\evil.com",
    "evil",
    "",
    "/\tevil.com",
    null,
    undefined,
  ])("devolve o destino padrão para %j", (valor) => {
    expect(sanitizarNext(valor)).toBe(DESTINO_PADRAO);
  });

  it("o destino padrão é /dashboard", () => {
    expect(DESTINO_PADRAO).toBe("/dashboard");
  });
});
