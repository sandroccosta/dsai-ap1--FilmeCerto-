import { Search } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { obterUsuarioAtual } from "@/features/auth/sessao";

import { LinkNav } from "./link-nav";
import { MenuUsuario } from "./menu-usuario";

export async function Header() {
  const usuario = await obterUsuarioAtual();

  return (
    <header className="border-border/60 bg-background/85 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-8">
          <Link
            href={usuario ? "/dashboard" : "/"}
            className="text-2xl font-extrabold tracking-tight [font-stretch:75%]"
          >
            Filme <span className="text-primary">Certo</span>
          </Link>
          {usuario && (
            <nav
              aria-label="Navegação principal"
              className="text-muted-foreground hidden items-center gap-6 text-sm sm:flex"
            >
              <LinkNav href="/dashboard">Início</LinkNav>
              <LinkNav href="/listas">Minhas listas</LinkNav>
            </nav>
          )}
        </div>

        {usuario ? (
          <div className="text-muted-foreground flex items-center gap-3 text-sm">
            <form action="/busca" method="get" role="search" className="relative hidden sm:block">
              <Search
                className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
                aria-hidden="true"
              />
              <Input
                name="q"
                type="search"
                aria-label="Buscar filmes"
                placeholder="Buscar filmes"
                className="h-9 w-44 pl-8 lg:w-64"
              />
            </form>
            <Link
              href="/busca"
              aria-label="Buscar filmes"
              className="hover:text-foreground p-1 transition-colors sm:hidden"
            >
              <Search className="size-5" aria-hidden="true" />
            </Link>
            <MenuUsuario nome={usuario.nome} email={usuario.email} />
          </div>
        ) : (
          <nav
            aria-label="Navegação principal"
            className="text-muted-foreground flex items-center gap-5 text-sm"
          >
            <LinkNav href="/sobre">Sobre</LinkNav>
            <LinkNav href="/login">Entrar</LinkNav>
            <Link href="/cadastro" className={buttonVariants({ className: "h-9 px-4" })}>
              Criar conta
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
