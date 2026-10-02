import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { sair } from "@/features/auth/actions";
import { obterUsuarioAtual } from "@/features/auth/sessao";

export async function Header() {
  const usuario = await obterUsuarioAtual();

  return (
    <header className="border-border/60 bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href={usuario ? "/dashboard" : "/"} className="text-xl font-bold tracking-tight">
          Filme <span className="text-primary">Certo</span>
        </Link>
        <nav
          aria-label="Navegação principal"
          className="text-muted-foreground flex items-center gap-4 text-sm"
        >
          <Link href="/sobre" className="hover:text-foreground transition-colors">
            Sobre
          </Link>
          {usuario ? (
            <>
              <span className="text-foreground hidden max-w-40 truncate sm:inline">
                {usuario.nome}
              </span>
              <form action={sair}>
                <Button type="submit" variant="outline" size="sm">
                  Sair
                </Button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-foreground transition-colors">
                Entrar
              </Link>
              <Link href="/cadastro" className={buttonVariants({ size: "sm" })}>
                Criar conta
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
