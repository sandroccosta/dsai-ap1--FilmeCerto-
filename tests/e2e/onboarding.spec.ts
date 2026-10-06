import { expect, test } from "@playwright/test";

import { emailAleatorio } from "../support/supabase-local";
import { cadastrar, concluirOnboarding, RESUMO_ONBOARDING, titulosDasSecoes } from "./helpers";

test("cadastro, onboarding completo e resumo no dashboard", async ({ page }) => {
  await cadastrar(page, "Fê Rocha", emailAleatorio("e2e"));
  await concluirOnboarding(page);

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Olá, Fê Rocha");
  await expect(page.getByTestId("resumo-preferencias")).toHaveText(RESUMO_ONBOARDING);
});

test("pulando os passos opcionais, o dashboard não tem 'Nos seus streamings'", async ({ page }) => {
  await cadastrar(page, "Lia Campos", emailAleatorio("e2e"));
  await concluirOnboarding(page);

  await expect(page.getByRole("region", { name: "Escolhidos para você" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Nos seus streamings" })).toHaveCount(0);
});

test("onboarding completo: streamings primeiro, parecidos com os amados e sem o gênero evitado", async ({
  page,
}) => {
  await cadastrar(page, "Rui Matos", emailAleatorio("e2e"));
  await expect(page).toHaveURL("/onboarding");
  const main = page.getByRole("main");

  await expect(main.getByText("Passo 1 de 7")).toBeVisible();
  await main.getByRole("button", { name: "Ação", exact: true }).click();
  await main.getByRole("button", { name: "Próximo" }).click();
  await main.getByRole("button", { name: "Terror", exact: true }).click();
  await main.getByRole("button", { name: "Próximo" }).click();
  await main.getByRole("radio", { name: "Tanto faz" }).check();
  await main.getByRole("button", { name: "Próximo" }).click();
  await main.getByRole("radio", { name: "Toda semana" }).check();
  await main.getByRole("button", { name: "Próximo" }).click();
  await main.getByRole("button", { name: "Netflix" }).click();
  await main.getByRole("button", { name: "Próximo" }).click();

  const posteres = main.getByRole("button", { name: /^Marcar / });
  await posteres.nth(0).click();
  await posteres.nth(1).click();
  await expect(main.getByText("2 de 5")).toBeVisible();
  await main.getByRole("button", { name: "Próximo" }).click();

  await expect(main.getByText("Passo 7 de 7")).toBeVisible();
  const primeiroDaGrade = await main
    .getByRole("button", { name: /^Marcar / })
    .first()
    .getAttribute("aria-label");
  await main.getByRole("button", { name: "Mostrar outros filmes" }).click();
  await expect(main.getByRole("button", { name: primeiroDaGrade ?? "" })).toHaveCount(0);
  await main
    .getByRole("button", { name: /^Marcar / })
    .first()
    .click();
  await main.getByRole("button", { name: "Concluir" }).click();
  await expect(page).toHaveURL("/dashboard", { timeout: 15_000 });

  await expect(page.getByRole("region", { name: "Nos seus streamings" })).toBeVisible();
  const titulos = await titulosDasSecoes(page);
  expect(titulos.indexOf("Nos seus streamings")).toBeLessThan(
    titulos.indexOf("Escolhidos para você"),
  );
  expect(titulos.filter((titulo) => /^Porque você amou /.test(titulo))).toHaveLength(2);
  expect(titulos).not.toContain("Terror para você");
  await expect(main.getByText(/^Terror \d/)).toHaveCount(0);
});

test("sem preferências, o dashboard manda para o onboarding", async ({ page }) => {
  await cadastrar(page, "Gabi Nunes", emailAleatorio("e2e"));
  await expect(page).toHaveURL("/onboarding");

  await page.goto("/dashboard");
  await expect(page).toHaveURL("/onboarding");
});

test("depois de concluir, o onboarding manda para o dashboard", async ({ page }) => {
  await cadastrar(page, "Hugo Prado", emailAleatorio("e2e"));
  await concluirOnboarding(page);

  await page.goto("/onboarding");
  await expect(page).toHaveURL("/dashboard");
});

test("sem sessão, o onboarding exige login", async ({ page }) => {
  await page.goto("/onboarding");
  await expect(page).toHaveURL("/login?next=%2Fonboarding");
});
