"use client";

import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";

export default function ErroFilme({ retry }: { error: Error; retry: () => void }) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-start gap-4 px-4 py-16">
      <h1 className="text-2xl font-bold tracking-tight">
        Não foi possível carregar este filme agora.
      </h1>
      <p className="text-muted-foreground">Pode ser algo passageiro. Tente de novo em instantes.</p>
      <div className="flex gap-3">
        <Button onClick={() => retry()} size="lg">
          Tentar de novo
        </Button>
        <Link href="/dashboard" className={buttonVariants({ variant: "outline", size: "lg" })}>
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
