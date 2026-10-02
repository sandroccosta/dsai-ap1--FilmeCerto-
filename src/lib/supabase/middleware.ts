import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getPublicEnv } from "@/lib/env";

/**
 * Renova a sessão do Supabase a cada requisição e devolve a resposta com os
 * cookies atualizados, junto com o usuário autenticado (ou `null`).
 * Pensado para ser chamado a partir de `src/proxy.ts`.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const env = getPublicEnv();

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Não coloque código entre a criação do cliente e getUser(): isso pode
  // causar logouts aleatórios difíceis de depurar.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user };
}
