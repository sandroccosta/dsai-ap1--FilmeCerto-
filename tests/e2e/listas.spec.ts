import { expect, test, type Page } from "@playwright/test";

import { emailAleatorio } from "../support/supabase-local";
import { cadastrar, concluirOnboarding } from "./helpers";

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

/** Clica num botão de um grupo e espera a Server Action terminar. */
async function clicar(page: Page, grupo: string, nome: string, marcado: "true" | "false") {
  const botao = page.getByRole("group", { name: grupo }).getByRole("button", { name: nome });
  await botao.click();
  await expect(botao).toBeEnabled();
  await expect(botao).toHaveAttribute("aria-pressed", marcado);
}

test("Quero assistir, Já assisti e remover, refletidos em /listas e no dashboard", async ({
  page,
}) => {
  await cadastrar(page, "Paula Neri", emailAleatorio("e2e"));
  await concluirOnboarding(page);
  const id = await abrirPrimeiroFilme(page);
  const cartao = (p: Page) => p.getByRole("main").locator(`a[href="/filme/${id}"]`);

  await clicar(page, "Minhas listas", "Quero assistir", "true");
  await page.getByRole("banner").getByRole("link", { name: "Minhas listas" }).click();
  await expect(page).toHaveURL("/listas");
  await expect(page.getByRole("link", { name: "Quero assistir (1)" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(cartao(page)).toBeVisible();

  await page.goto(`/filme/${id}`);
  await clicar(page, "O que achou?", "Amei", "true");
  await clicar(page, "Minhas listas", "Já assisti", "true");
  await expect(
    page
      .getByRole("group", { name: "Minhas listas" })
      .getByRole("button", { name: "Quero assistir" }),
  ).toHaveAttribute("aria-pressed", "false");

  await page.goto("/listas?aba=assistidos");
  await expect(page.getByRole("link", { name: "Já assisti (1)" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(page.getByRole("link", { name: "Quero assistir (0)" })).toBeVisible();
  await expect(cartao(page)).toBeVisible();
  await expect(page.getByRole("main").getByText("Amei")).toBeVisible();

  await page.goto("/dashboard");
  await expect(page.getByRole("region", { name: "Escolhidos para você" })).toBeVisible();
  await expect(cartao(page)).toHaveCount(0);

  await page.goto(`/filme/${id}`);
  await clicar(page, "Minhas listas", "Já assisti", "false");
  await page.goto("/listas?aba=assistidos");
  await expect(page.getByText(/Nada por aqui ainda/)).toBeVisible();
});

test("sem sessão, /listas exige login", async ({ page }) => {
  await page.goto("/listas");
  await expect(page).toHaveURL("/login?next=%2Flistas");
});
