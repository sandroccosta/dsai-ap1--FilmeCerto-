import { expect, test } from "@playwright/test";

const TMDB_ATTRIBUTION = "This product uses the TMDB API but is not endorsed or certified by TMDB.";

test("a página inicial mostra a marca", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Filme Certo");
  await expect(page).toHaveTitle("Filme Certo");
});

test("/sobre mostra a atribuição ao TMDB e a menção à JustWatch", async ({ page }) => {
  await page.goto("/sobre");
  const main = page.getByRole("main");
  await expect(main.getByText(TMDB_ATTRIBUTION)).toBeVisible();
  await expect(main.getByRole("link", { name: "JustWatch" })).toBeVisible();
});

test("o rodapé mostra a atribuição ao TMDB em todas as páginas", async ({ page }) => {
  for (const path of ["/", "/sobre"]) {
    await page.goto(path);
    await expect(page.getByRole("contentinfo").getByText(TMDB_ATTRIBUTION)).toBeVisible();
  }
});

test("GET /api/health responde ok", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ status: "ok" });
});
