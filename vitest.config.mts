import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  resolve: {
    alias: {
      // `server-only` lança erro fora do ambiente react-server; nos testes ele é um módulo vazio.
      "server-only": new URL("./tests/support/empty-module.ts", import.meta.url).pathname,
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "jsdom",
          include: ["tests/unit/**/*.test.{ts,tsx}"],
          setupFiles: ["./tests/support/setup.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          environment: "node",
          include: ["tests/integration/**/*.test.ts"],
          // Contra o Supabase local: rede e banco reais, então sem paralelismo entre arquivos.
          fileParallelism: false,
          testTimeout: 20_000,
        },
      },
    ],
  },
});
