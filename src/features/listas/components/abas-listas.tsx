import { cn } from "cn";
import Link from "next/link";

import type { Aba } from "@/features/listas/opcoes";

const ABAS: { aba: Aba; rotulo: string; href: string }[] = [
  { aba: "quero", rotulo: "Quero assistir", href: "/listas" },
  { aba: "assistidos", rotulo: "Já assisti", href: "/listas?aba=assistidos" },
];

export function AbasListas({ ativa, contagem }: { ativa: Aba; contagem: Record<Aba, number> }) {
  return (
    <nav aria-label="Listas" className="border-border flex gap-1 border-b">
      {ABAS.map(({ aba, rotulo, href }) => (
        <Link
          key={aba}
          href={href}
          aria-current={aba === ativa ? "page" : undefined}
          className={cn(
            "-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors",
            aba === ativa
              ? "border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground border-transparent",
          )}
        >
          {`${rotulo} (${contagem[aba]})`}
        </Link>
      ))}
    </nav>
  );
}
