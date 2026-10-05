import { expect, test } from "@playwright/test";

import { emailAleatorio } from "../support/supabase-local";
import { cadastrar, concluirOnboarding, entrar, sair } from "./helpers";

test("cadastro com dados válidos leva ao onboarding com a sessão aberta", async ({ page }) => {
  await cadastrar(page, "Ana Souza", emailAleatorio("e2e"));

  await expect(page).toHaveURL("/onboarding");
  await expect(page.getByRole("banner").getByText("Ana Souza")).toBeVisible();
});

test("cadastro com email já usado mostra o erro", async ({ page }) => {
  const email = emailAleatorio("e2e");
  await cadastrar(page, "Ana Souza", email);
  await expect(page).toHaveURL("/onboarding");
  await sair(page);

  await cadastrar(page, "Outra Pessoa", email);
  await expect(page.getByRole("main").getByRole("alert")).toHaveText(
    "Este email já está cadastrado.",
  );
  await expect(page.getByLabel("Nome")).toHaveValue("Outra Pessoa");
});

test("sair encerra a sessão e o dashboard volta a exigir login", async ({ page }) => {
  await cadastrar(page, "Bia Lima", emailAleatorio("e2e"));
  await expect(page).toHaveURL("/onboarding");

  await sair(page);
  await page.goto("/dashboard");
  await expect(page).toHaveURL("/login?next=%2Fdashboard");
});

test("login com senha errada mostra o erro", async ({ page }) => {
  const email = emailAleatorio("e2e");
  await cadastrar(page, "Caio Reis", email);
  await expect(page).toHaveURL("/onboarding");
  await sair(page);

  await page.goto("/login");
  await entrar(page, email, "senhaerrada1");
  await expect(page.getByRole("main").getByRole("alert")).toHaveText("Email ou senha incorretos.");
  await expect(page.getByLabel("Email")).toHaveValue(email);
});

test("login a partir de ?next volta para a página pedida", async ({ page }) => {
  const email = emailAleatorio("e2e");
  await cadastrar(page, "Duda Alves", email);
  await concluirOnboarding(page);
  await sair(page);

  await page.goto("/dashboard");
  await expect(page).toHaveURL("/login?next=%2Fdashboard");
  await entrar(page, email);
  await expect(page).toHaveURL("/dashboard");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Olá, Duda Alves");
});

test("com sessão, /login, /cadastro e / levam ao dashboard", async ({ page }) => {
  await cadastrar(page, "Edu Melo", emailAleatorio("e2e"));
  await concluirOnboarding(page);

  for (const rota of ["/login", "/cadastro", "/"]) {
    await page.goto(rota);
    await expect(page).toHaveURL("/dashboard");
  }
});
