import { expect, test } from "@playwright/test";

import { emailAleatorio } from "../support/supabase-local";
import { cadastrar, concluirOnboarding } from "./helpers";

test("trocar nome e preferências reflete no header e no dashboard", async ({ page }) => {
  await cadastrar(page, "Tiago Lima", emailAleatorio("e2e"));
  await concluirOnboarding(page);

  await page.getByRole("banner").getByRole("link", { name: "Tiago Lima" }).click();
  await expect(page).toHaveURL("/perfil");
  const main = page.getByRole("main");

  const dados = main.getByRole("region", { name: "Seus dados" });
  await dados.getByLabel("Nome").fill("Novo Nome");
  await dados.getByRole("button", { name: "Salvar nome" }).click();
  await expect(dados.getByRole("status")).toHaveText("Alterações salvas.");
  await expect(page.getByRole("banner").getByRole("link", { name: "Novo Nome" })).toBeVisible();

  const preferencias = main.getByRole("region", { name: "Suas preferências" });
  for (const genero of ["Ação", "Drama", "Terror"]) {
    await preferencias.getByRole("button", { name: genero, exact: true }).click();
  }
  await preferencias.getByRole("button", { name: "Salvar preferências" }).click();
  await expect(preferencias.getByRole("status")).toHaveText("Alterações salvas.");

  await page.goto("/dashboard");
  await expect(page.getByTestId("resumo-preferencias")).toHaveText(/^Terror · /);
  await expect(page.getByRole("region", { name: "Terror para você" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Ação para você" })).toHaveCount(0);
});

test("sem sessão, /perfil exige login", async ({ page }) => {
  await page.goto("/perfil");
  await expect(page).toHaveURL("/login?next=%2Fperfil");
});
