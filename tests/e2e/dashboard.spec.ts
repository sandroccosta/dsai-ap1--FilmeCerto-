import { expect, test, type Page } from "@playwright/test";

import { emailAleatorio } from "../support/supabase-local";
import { cadastrar, concluirOnboarding } from "./helpers";

/** IDs de todos os filmes na página, na ordem em que aparecem. */
async function idsDosFilmes(page: Page) {
  const hrefs = await page
    .getByRole("main")
    .locator('a[href^="/filme/"]')
    .evaluateAll((links) => links.map((link) => link.getAttribute("href")));
  return hrefs;
}

test("o dashboard mostra as seções do motor com cards e motivos", async ({ page }) => {
  await cadastrar(page, "Iara Dias", emailAleatorio("e2e"));
  await concluirOnboarding(page);

  const main = page.getByRole("main");
  for (const titulo of ["Escolhidos para você", "Ação para você", "Drama para você"]) {
    const secao = main.getByRole("region", { name: titulo });
    await expect(secao).toBeVisible();
    await expect(secao.getByRole("listitem").first()).toBeVisible();
    await expect(secao.getByText(/^Porque você curte /).first()).toBeVisible();
  }

  const primeiro = main
    .getByRole("region", { name: "Escolhidos para você" })
    .getByRole("link")
    .first();
  await expect(primeiro).toHaveAttribute("href", /^\/filme\/\d+$/);
});

test("'Gerar outras recomendações' avança a rodada e troca os filmes", async ({ page }) => {
  await cadastrar(page, "João Lopes", emailAleatorio("e2e"));
  await concluirOnboarding(page);
  const antes = await idsDosFilmes(page);

  await page.getByRole("link", { name: "Gerar outras recomendações" }).click();
  await expect(page).toHaveURL("/dashboard?rodada=1");
  await expect(page.getByRole("region", { name: "Escolhidos para você" })).toBeVisible();

  expect(await idsDosFilmes(page)).not.toEqual(antes);
});

test("uma seção que falha mostra o erro e as outras carregam", async ({ page }) => {
  await cadastrar(page, "Kátia Moura", emailAleatorio("e2e"));
  await expect(page).toHaveURL("/onboarding");
  const main = page.getByRole("main");
  await main.getByRole("button", { name: "Documentário", exact: true }).click();
  await main.getByRole("button", { name: "Drama", exact: true }).click();
  await main.getByRole("button", { name: "Próximo" }).click();
  await main.getByRole("radio", { name: "Tanto faz" }).check();
  await main.getByRole("button", { name: "Próximo" }).click();
  await main.getByRole("radio", { name: "Toda semana" }).check();
  await main.getByRole("button", { name: "Concluir" }).click();
  await expect(page).toHaveURL("/dashboard");

  const documentario = main.getByRole("region", { name: "Documentário para você" });
  await expect(documentario.getByText("Não foi possível carregar agora.")).toBeVisible();
  await expect(documentario.getByRole("link", { name: "Tentar de novo" })).toBeVisible();

  const drama = main.getByRole("region", { name: "Drama para você" });
  await expect(drama.getByRole("listitem").first()).toBeVisible();
});
