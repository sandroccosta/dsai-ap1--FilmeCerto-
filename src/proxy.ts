import { NextResponse, type NextRequest } from "next/server";

import { DESTINO_PADRAO } from "@/features/auth/redirecionamento";
import { updateSession } from "@/lib/supabase/middleware";

/** Rotas que exigem sessão: a área logada (grupo `(app)`) e o onboarding. */
const ROTAS_PROTEGIDAS = ["/dashboard", "/onboarding", "/filme", "/listas", "/busca", "/perfil"];
/** Rotas que só fazem sentido sem sessão. */
const ROTAS_DE_VISITANTE = ["/", "/login", "/cadastro"];

function corresponde(caminho: string, rotas: string[]) {
  return rotas.some((rota) => caminho === rota || caminho.startsWith(`${rota}/`));
}

/** Redireciona mantendo os cookies de sessão que o Supabase acabou de renovar. */
function redirecionar(destino: URL, response: NextResponse) {
  const redirect = NextResponse.redirect(destino);
  for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
  return redirect;
}

/**
 * Checagem otimista: renova a sessão e redireciona antes de renderizar.
 * A checagem definitiva fica no layout de `(app)` e na RLS do banco.
 */
export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname, search } = request.nextUrl;

  if (!user && corresponde(pathname, ROTAS_PROTEGIDAS)) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", `${pathname}${search}`);
    return redirecionar(login, response);
  }

  if (user && ROTAS_DE_VISITANTE.includes(pathname)) {
    return redirecionar(new URL(DESTINO_PADRAO, request.url), response);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
