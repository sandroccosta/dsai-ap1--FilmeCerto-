import { expect, test, type Page } from "@playwright/test";

import { emailAleatorio } from "../support/supabase-local";
import { cadastrar, concluirOnboarding } from "./helpers";

/** Abre o primeiro filme de "Escolhidos para você" e devolve o ID. */
async function abrirPrimeiroFilme(page: Page) {
  const card = page
    .getByRole("main")
    .getByRole("region", { name: "Escolhidos para você" })
    .getByRole("link")
    .first();
  const id = (await card.getAttribute("href"))?.split("/").at(-1) ?? "";
  await card.click();
  await expect(page).toHaveURL(`/filme/${id}`);
  return id;
}

const botao = (page: Page, nome: string) =>
  page.getByRole("group", { name: "O que achou?" }).getByRole("button", { name: nome });

/** Clica numa reação e espera a Server Action terminar (os botões voltam a ficar habilitados). */
async function reagir(page: Page, nome: string, marcada: "true" | "false") {
  await botao(page, nome).click();
  await expect(botao(page, nome)).toBeEnabled();
  await expect(botao(page, nome)).toHaveAttribute("aria-pressed", marcada);
}

test("Amei fica marcado, cria a seção de parecidos e some ao desfazer", async ({ page }) => {
  await cadastrar(page, "Nina Prado", emailAleatorio("e2e"));
  await concluirOnboarding(page);
  const id = await abrirPrimeiroFilme(page);

  await reagir(page, "Amei", "true");
  await page.reload();
  await expect(botao(page, "Amei")).toHaveAttribute("aria-pressed", "true");

  await page.goto("/dashboard");
  const main = page.getByRole("main");
  const secao = main.getByRole("region", { name: `Porque você amou Filme ${id}` });
  await expect(secao.getByRole("listitem").first()).toBeVisible();
  await expect(main.locator(`a[href="/filme/${id}"]`)).toHaveCount(0);

  await page.goto(`/filme/${id}`);
  await reagir(page, "Amei", "false");
  await page.reload();
  for (const nome of ["Não é pra mim", "Gostei", "Amei"]) {
    await expect(botao(page, nome)).toHaveAttribute("aria-pressed", "false");
  }

  await page.goto("/dashboard");
  await expect(page.getByRole("region", { name: "Escolhidos para você" })).toBeVisible();
  await expect(page.getByRole("region", { name: `Porque você amou Filme ${id}` })).toHaveCount(0);
});

test("trocar de Gostei para Não é pra mim deixa só a nova marcada", async ({ page }) => {
  await cadastrar(page, "Otto Reis", emailAleatorio("e2e"));
  await concluirOnboarding(page);
  await abrirPrimeiroFilme(page);

  await reagir(page, "Gostei", "true");
  await reagir(page, "Não é pra mim", "true");

  await page.reload();
  await expect(botao(page, "Não é pra mim")).toHaveAttribute("aria-pressed", "true");
  await expect(botao(page, "Gostei")).toHaveAttribute("aria-pressed", "false");
  await expect(botao(page, "Amei")).toHaveAttribute("aria-pressed", "false");
});
