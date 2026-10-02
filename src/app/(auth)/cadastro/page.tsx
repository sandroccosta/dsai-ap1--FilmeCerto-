import type { Metadata } from "next";

import { CadastroForm } from "@/features/auth/components/cadastro-form";

export const metadata: Metadata = { title: "Criar conta" };

export default function CadastroPage() {
  return (
    <>
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Criar conta</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        Leva menos de um minuto e as recomendações ficam do seu jeito.
      </p>
      <CadastroForm />
    </>
  );
}
