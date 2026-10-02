import { expect, test, type Page } from "@playwright/test";

import { emailAleatorio, SENHA_TESTE } from "../support/supabase-local";

async function cadastrar(page: Page, nome: string, email: string) {
  await page.goto("/cadastro");
  await page.getByLabel("Nome").fill(nome);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(SENHA_TESTE);
  await page.getByLabel("Confirme a senha").fill(SENHA_TESTE);
  await page.getByRole("main").getByRole("button", { name: "Criar conta" }).click();
}

async function entrar(page: Page, email: string, senha = SENHA_TESTE) {
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Senha").fill(senha);
  await page.getByRole("main").getByRole("button", { name: "Entrar" }).click();
}

async function sair(page: Page) {
  await page.getByRole("banner").getByRole("button", { name: "Sair" }).click();
  await expect(page).toHaveURL("/");
}

test("cadastro com dados válidos leva ao dashboard com o nome", async ({ page }) => {
  await cadastrar(page, "Ana Souza", emailAleatorio("e2e"));

  await expect(page).toHaveURL("/dashboard");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Olá, Ana Souza");
  await expect(page.getByRole("banner").getByText("Ana Souza")).toBeVisible();
});

test("cadastro com email já usado mostra o erro", async ({ page }) => {
  const email = emailAleatorio("e2e");
  await cadastrar(page, "Ana Souza", email);
  await expect(page).toHaveURL("/dashboard");
  await sair(page);

  await cadastrar(page, "Outra Pessoa", email);
  await expect(page.getByRole("main").getByRole("alert")).toHaveText(
    "Este email já está cadastrado.",
  );
  await expect(page.getByLabel("Nome")).toHaveValue("Outra Pessoa");
});

test("sair encerra a sessão e o dashboard volta a exigir login", async ({ page }) => {
  await cadastrar(page, "Bia Lima", emailAleatorio("e2e"));
  await expect(page).toHaveURL("/dashboard");

  await sair(page);
  await page.goto("/dashboard");
  await expect(page).toHaveURL("/login?next=%2Fdashboard");
});

test("login com senha errada mostra o erro", async ({ page }) => {
  const email = emailAleatorio("e2e");
  await cadastrar(page, "Caio Reis", email);
  await sair(page);

  await page.goto("/login");
  await entrar(page, email, "senhaerrada1");
  await expect(page.getByRole("main").getByRole("alert")).toHaveText("Email ou senha incorretos.");
  await expect(page.getByLabel("Email")).toHaveValue(email);
});

test("login a partir de ?next volta para a página pedida", async ({ page }) => {
  const email = emailAleatorio("e2e");
  await cadastrar(page, "Duda Alves", email);
  await sair(page);

  await page.goto("/dashboard");
  await expect(page).toHaveURL("/login?next=%2Fdashboard");
  await entrar(page, email);
  await expect(page).toHaveURL("/dashboard");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Olá, Duda Alves");
});

test("com sessão, /login, /cadastro e / levam ao dashboard", async ({ page }) => {
  await cadastrar(page, "Edu Melo", emailAleatorio("e2e"));
  await expect(page).toHaveURL("/dashboard");

  for (const rota of ["/login", "/cadastro", "/"]) {
    await page.goto(rota);
    await expect(page).toHaveURL("/dashboard");
  }
});
