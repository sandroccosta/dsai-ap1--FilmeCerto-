import Link from "next/link";

export function Header() {
  return (
    <header className="border-border/60 bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold tracking-tight">
          Filme <span className="text-primary">Certo</span>
        </Link>
        <nav aria-label="Navegação principal" className="text-muted-foreground text-sm">
          <Link href="/sobre" className="hover:text-foreground transition-colors">
            Sobre
          </Link>
        </nav>
      </div>
    </header>
  );
}
