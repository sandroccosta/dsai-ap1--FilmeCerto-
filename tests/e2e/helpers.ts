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

/**
 * Conclui o wizard com os gêneros dados (padrão: Ação + Drama), filmes médios e toda semana,
 * pulando os passos opcionais (gêneros evitados, streamings e filmes).
 */
export async function concluirOnboarding(page: Page, generos = ["Ação", "Drama"]) {
  await expect(page).toHaveURL("/onboarding");
  const main = page.getByRole("main");
  for (const genero of generos) {
    await main.getByRole("button", { name: genero, exact: true }).click();
  }
  await main.getByRole("button", { name: "Próximo" }).click();
  await main.getByRole("button", { name: "Pular" }).click();
  await main.getByRole("radio", { name: "Médios (90 a 120 min)" }).check();
  await main.getByRole("button", { name: "Próximo" }).click();
  await main.getByRole("radio", { name: "Toda semana" }).check();
  await main.getByRole("button", { name: "Próximo" }).click();
  await main.getByRole("button", { name: "Pular" }).click();
  await main.getByRole("button", { name: "Pular" }).click();
  await main.getByRole("button", { name: "Concluir" }).click();
  // Salvar espera as sugestões dos passos 6 e 7 (as Server Actions rodam uma por vez) e o dashboard.
  await expect(page).toHaveURL("/dashboard", { timeout: 15_000 });
}

/** Títulos das seções do dashboard, na ordem da página. */
export async function titulosDasSecoes(page: Page) {
  return page.getByRole("main").locator("section > h2").allTextContents();
}

export const RESUMO_ONBOARDING = "Ação, Drama · Médios (90 a 120 min) · Toda semana";
