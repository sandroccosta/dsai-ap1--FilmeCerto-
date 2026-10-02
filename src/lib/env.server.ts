import "server-only";

import { parseServerEnv, type ServerEnv } from "./env";

let cachedServerEnv: ServerEnv | undefined;

/** Variáveis do servidor, incluindo segredos. Nunca importe este módulo em componentes cliente. */
export function getServerEnv(): ServerEnv {
  cachedServerEnv ??= parseServerEnv(process.env);
  return cachedServerEnv;
}
