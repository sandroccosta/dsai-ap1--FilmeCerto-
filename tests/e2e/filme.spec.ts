import { expect, test } from "@playwright/test";

import { emailAleatorio } from "../support/supabase-local";
import { cadastrar, concluirOnboarding } from "./helpers";

test("do dashboard, o card abre a página do filme com todas as seções", async ({ page }) => {
  await cadastrar(page, "Lia Campos", emailAleatorio("e2e"));
  await concluirOnboarding(page);

  const card = page
    .getByRole("main")
    .getByRole("region", { name: "Escolhidos para você" })
    .getByRole("link")
    .first();
  const href = await card.getAttribute("href");
  const id = href?.split("/").at(-1);
  await card.click();

  await expect(page).toHaveURL(`/filme/${id}`);
  const main = page.getByRole("main");
  await expect(main.getByRole("heading", { level: 1 })).toHaveText(`Filme ${id}`);
  await expect(main.getByText(`Sinopse do Filme ${id}.`)).toBeVisible();
  await expect(main.getByText("Netflix")).toBeVisible();
  await expect(main.getByText("Dados de onde assistir fornecidos por JustWatch.")).toBeVisible();
  const parecidos = main.getByRole("region", { name: "Filmes parecidos" });
  await expect(parecidos.getByRole("listitem")).toHaveCount(5);
  await expect(page).toHaveTitle(/^Filme \d+ \(\d{4}\) · Filme Certo$/);

  await expect(main.locator("iframe")).toHaveCount(0);
  await main.getByRole("button", { name: "Assistir trailer" }).click();
  await expect(main.locator('iframe[src*="youtube-nocookie.com/embed/trailer-falso"]')).toHaveCount(
    1,
  );
});

test("filme inexistente ou ID inválido mostram o 404", async ({ page }) => {
  await cadastrar(page, "Mário Luz", emailAleatorio("e2e"));
  await concluirOnboarding(page);

  for (const rota of ["/filme/999999999", "/filme/abc"]) {
    await page.goto(rota);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Página não encontrada");
  }
});

test("sem sessão, a página do filme exige login", async ({ page }) => {
  await page.goto("/filme/123");
  await expect(page).toHaveURL("/login?next=%2Ffilme%2F123");
});
