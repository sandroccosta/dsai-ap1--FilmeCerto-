for (const arquivo of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(arquivo);
  } catch {
    // Arquivo ausente.
  }
}

/** Token real do TMDB, se houver. No CI o token é falso, então os testes reais são pulados. */
export const TOKEN_TMDB_REAL = process.env.CI ? undefined : process.env.TMDB_READ_TOKEN;
