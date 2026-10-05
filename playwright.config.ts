import { defineConfig, devices } from "@playwright/test";

import { SUPABASE_LOCAL } from "./tests/support/supabase-local";

// Porta própria para não reaproveitar um `pnpm dev` apontando para outro banco.
const PORT = Number(process.env.E2E_PORT ?? 3100);
const baseURL = `http://localhost:${PORT}`;
const TMDB_FALSO_PORTA = 4010;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      // TMDB falso: respostas determinísticas, sem depender da internet.
      command: `node tests/e2e/tmdb-falso/servidor.mjs ${TMDB_FALSO_PORTA}`,
      url: `http://127.0.0.1:${TMDB_FALSO_PORTA}/3/discover/movie`,
      reuseExistingServer: false,
      timeout: 30_000,
    },
    {
      // No CI o build já foi feito com as variáveis do Supabase local. Localmente o
      // build é refeito, porque as variáveis NEXT_PUBLIC_* são embutidas no build.
      command: process.env.CI
        ? `pnpm start --port ${PORT}`
        : `pnpm build && pnpm start --port ${PORT}`,
      url: `${baseURL}/api/health`,
      reuseExistingServer: false,
      timeout: 300_000,
      env: {
        NEXT_PUBLIC_SUPABASE_URL: SUPABASE_LOCAL.url,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: SUPABASE_LOCAL.publishableKey,
        TMDB_READ_TOKEN: "token-e2e",
        TMDB_API_URL: `http://127.0.0.1:${TMDB_FALSO_PORTA}/3`,
      },
    },
  ],
});
