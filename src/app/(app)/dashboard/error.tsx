"use client";

import { Button } from "@/components/ui/button";

export default function ErroDashboard({ retry }: { error: Error; retry: () => void }) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-start gap-4 px-4 py-16">
      <h1 className="text-2xl font-bold tracking-tight">
        Não foi possível carregar suas recomendações.
      </h1>
      <p className="text-muted-foreground">Pode ser algo passageiro. Tente de novo em instantes.</p>
      <Button onClick={() => retry()} size="lg">
        Tentar de novo
      </Button>
    </div>
  );
}
