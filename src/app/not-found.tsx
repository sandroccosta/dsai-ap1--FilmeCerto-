import type { Metadata } from "next";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Página não encontrada" };

export default function NaoEncontrada() {
  return (
    <section className="mx-auto flex max-w-xl flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <p className="text-primary text-sm font-semibold">404</p>
      <h1 className="text-3xl font-bold tracking-tight">Página não encontrada</h1>
      <p className="text-muted-foreground">
        O filme ou a página que você procurou não existe ou foi removido.
      </p>
      <Link href="/" className={buttonVariants({ size: "lg" })}>
        Voltar ao início
      </Link>
    </section>
  );
}
