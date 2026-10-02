import { z } from "zod";

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

const serverSchema = publicSchema.extend({
  TMDB_READ_TOKEN: z.string().min(1),
});

export type PublicEnv = z.infer<typeof publicSchema>;
export type ServerEnv = z.infer<typeof serverSchema>;

export class EnvError extends Error {
  constructor(public readonly variables: string[]) {
    super(
      `Variáveis de ambiente ausentes ou inválidas: ${variables.join(", ")}. ` +
        "Confira o arquivo .env.local (veja .env.example).",
    );
    this.name = "EnvError";
  }
}

function parse<T extends z.ZodType>(schema: T, source: Record<string, string | undefined>) {
  const result = schema.safeParse(source);
  if (!result.success) {
    const variables = [...new Set(result.error.issues.map((issue) => String(issue.path[0])))];
    throw new EnvError(variables);
  }
  return result.data as z.infer<T>;
}

export function parsePublicEnv(source: Record<string, string | undefined>): PublicEnv {
  return parse(publicSchema, source);
}

export function parseServerEnv(source: Record<string, string | undefined>): ServerEnv {
  return parse(serverSchema, source);
}

let cachedPublicEnv: PublicEnv | undefined;

/**
 * Variáveis seguras para o navegador. As referências a `process.env.NEXT_PUBLIC_*`
 * precisam ser literais para o Next.js conseguir embuti-las no bundle do cliente.
 */
export function getPublicEnv(): PublicEnv {
  cachedPublicEnv ??= parsePublicEnv({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
  return cachedPublicEnv;
}
