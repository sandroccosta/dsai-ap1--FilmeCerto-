import { expect, test } from "@playwright/test";

import { emailAleatorio } from "../support/supabase-local";
import { cadastrar, concluirOnboarding } from "./helpers";

test("trocar nome e preferências reflete no header e no dashboard", async ({ page }) => {
  await cadastrar(page, "Tiago Lima", emailAleatorio("e2e"));
  await concluirOnboarding(page);

  await page.getByRole("banner").getByRole("button", { name: "Menu do usuário" }).click();
  await page.getByRole("menuitem", { name: "Perfil" }).click();
  await expect(page).toHaveURL("/perfil");
  const main = page.getByRole("main");

  const dados = main.getByRole("region", { name: "Seus dados" });
  await dados.getByLabel("Nome").fill("Novo Nome");
  await dados.getByRole("button", { name: "Salvar nome" }).click();
  await expect(dados.getByRole("status")).toHaveText("Alterações salvas.");
  await expect(page.getByRole("banner").getByText("Novo Nome")).toBeVisible();

  const preferencias = main.getByRole("region", { name: "Suas preferências" });
  const favoritos = preferencias.getByRole("group", { name: "Gêneros favoritos" });
  for (const genero of ["Ação", "Drama", "Terror"]) {
    await favoritos.getByRole("button", { name: genero, exact: true }).click();
  }
  await preferencias.getByRole("button", { name: "Salvar preferências" }).click();
  await expect(preferencias.getByRole("status")).toHaveText("Alterações salvas.");

  await page.goto("/dashboard");
  await expect(page.getByTestId("resumo-preferencias")).toHaveText(/^Terror · /);
  await expect(page.getByRole("region", { name: "Terror para você" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Ação para você" })).toHaveCount(0);
});

test("marcar um streaming no perfil faz o dashboard ganhar 'Nos seus streamings'", async ({
  page,
}) => {
  await cadastrar(page, "Vera Dias", emailAleatorio("e2e"));
  await concluirOnboarding(page);
  await expect(page.getByRole("region", { name: "Nos seus streamings" })).toHaveCount(0);

  await page.goto("/perfil");
  const preferencias = page.getByRole("main").getByRole("region", { name: "Suas preferências" });
  await preferencias.getByRole("button", { name: "Amazon Prime Video" }).click();
  await preferencias.getByRole("button", { name: "Salvar preferências" }).click();
  await expect(preferencias.getByRole("status")).toHaveText("Alterações salvas.");

  await page.goto("/dashboard");
  await expect(page.getByRole("region", { name: "Nos seus streamings" })).toBeVisible();

  await page.goto("/perfil");
  await expect(
    page.getByRole("main").getByRole("button", { name: "Amazon Prime Video" }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("sem sessão, /perfil exige login", async ({ page }) => {
  await page.goto("/perfil");
  await expect(page).toHaveURL("/login?next=%2Fperfil");
});
