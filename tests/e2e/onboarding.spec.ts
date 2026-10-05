import { expect, test } from "@playwright/test";

import { emailAleatorio } from "../support/supabase-local";
import { cadastrar, concluirOnboarding, RESUMO_ONBOARDING } from "./helpers";

test("cadastro, onboarding completo e resumo no dashboard", async ({ page }) => {
  await cadastrar(page, "Fê Rocha", emailAleatorio("e2e"));
  await concluirOnboarding(page);

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Olá, Fê Rocha");
  await expect(page.getByTestId("resumo-preferencias")).toHaveText(RESUMO_ONBOARDING);
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
