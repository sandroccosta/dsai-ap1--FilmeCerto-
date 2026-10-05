import { expect, type Page } from "@playwright/test";

import { SENHA_TESTE } from "../support/supabase-local";

export async function cadastrar(page: Page, nome: string, email: string) {
  await page.goto("/cadastro");
  await page.getByLabel("Nome").fill(nome);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(SENHA_TESTE);
  await page.getByLabel("Confirme a senha").fill(SENHA_TESTE);
  await page.getByRole("main").getByRole("button", { name: "Criar conta" }).click();
}

export async function entrar(page: Page, email: string, senha = SENHA_TESTE) {
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Senha").fill(senha);
  await page.getByRole("main").getByRole("button", { name: "Entrar" }).click();
}

export async function sair(page: Page) {
  await page.getByRole("banner").getByRole("button", { name: "Sair" }).click();
  await expect(page).toHaveURL("/");
}

/** Conclui o wizard com Ação + Drama, filmes médios, toda semana. */
export async function concluirOnboarding(page: Page) {
  await expect(page).toHaveURL("/onboarding");
  const main = page.getByRole("main");
  await main.getByRole("button", { name: "Ação", exact: true }).click();
  await main.getByRole("button", { name: "Drama", exact: true }).click();
  await main.getByRole("button", { name: "Próximo" }).click();
  await main.getByRole("radio", { name: "Médios (90 a 120 min)" }).check();
  await main.getByRole("button", { name: "Próximo" }).click();
  await main.getByRole("radio", { name: "Toda semana" }).check();
  await main.getByRole("button", { name: "Concluir" }).click();
  await expect(page).toHaveURL("/dashboard");
}

export const RESUMO_ONBOARDING = "Ação, Drama · Médios (90 a 120 min) · Toda semana";
