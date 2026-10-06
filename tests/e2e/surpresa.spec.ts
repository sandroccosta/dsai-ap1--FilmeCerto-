import { expect, test } from "@playwright/test";

import { emailAleatorio } from "../support/supabase-local";
import { cadastrar, concluirOnboarding } from "./helpers";

test.describe("com movimento reduzido (padrão dos testes)", () => {
  test("Me surpreenda abre o pop-up, Esc fecha e Ver detalhes leva ao filme", async ({ page }) => {
    await cadastrar(page, "Vera Dias", emailAleatorio("e2e"));
    await concluirOnboarding(page);

    const secao = page.getByRole("region", { name: "Não sabe o que ver?" });
    await expect(secao).toBeVisible();
    await secao.getByRole("button", { name: "Me surpreenda" }).click();
    // Mesmo com movimento reduzido, o sorteio gira (mais suave) antes de abrir.
    await expect(secao.getByRole("button", { name: "Sorteando…" })).toBeVisible();

    const dialogo = page.getByRole("dialog");
    await expect(dialogo).toBeVisible();
    await expect(dialogo.getByRole("heading", { level: 2 })).not.toBeEmpty();

    await page.keyboard.press("Escape");
    await expect(dialogo).toBeHidden();

    await secao.getByRole("button", { name: "Me surpreenda" }).click();
    const detalhes = page.getByRole("dialog").getByRole("link", { name: "Ver detalhes" });
    const href = await detalhes.getAttribute("href");
    expect(href).toMatch(/^\/filme\/\d+$/);
    await detalhes.click();
    await expect(page).toHaveURL(href ?? "");
  });
});

test("três sorteios seguidos mostram três filmes diferentes", async ({ page }) => {
  await cadastrar(page, "Xavier Luz", emailAleatorio("e2e"));
  await concluirOnboarding(page);

  const titulos: string[] = [];
  await page.getByRole("button", { name: "Me surpreenda" }).click();
  for (let i = 0; i < 3; i++) {
    const dialogo = page.getByRole("dialog");
    await expect(dialogo).toBeVisible();
    titulos.push((await dialogo.getByRole("heading", { level: 2 }).textContent()) ?? "");
    if (i < 2) await dialogo.getByRole("button", { name: "Sortear outro" }).click();
  }
  expect(new Set(titulos).size).toBe(3);
});

test.describe("com animação", () => {
  test.use({ reducedMotion: "no-preference" });

  test("o pop-up abre depois do giro", async ({ page }) => {
    await cadastrar(page, "Wagner Reis", emailAleatorio("e2e"));
    await concluirOnboarding(page);

    const inicio = Date.now();
    await page.getByRole("button", { name: "Me surpreenda" }).click();
    await expect(page.getByRole("button", { name: "Sorteando…" })).toBeVisible();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    // O globo gira ~1,8 s antes de mostrar o filme: o pop-up não pode abrir na hora.
    expect(Date.now() - inicio).toBeGreaterThan(1000);
  });
});

test("o bloco fica depois da 2ª seção de recomendações", async ({ page }) => {
  await cadastrar(page, "Yara Couto", emailAleatorio("e2e"));
  await concluirOnboarding(page);

  const main = page.getByRole("main");
  await expect(main.getByRole("region", { name: "Não sabe o que ver?" })).toBeVisible();
  const titulos = await main.getByRole("heading", { level: 2 }).allTextContents();
  expect(titulos.indexOf("Não sabe o que ver?")).toBe(2);
});
