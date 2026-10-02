import type { Metadata } from "next";

import { exigirUsuario } from "@/features/auth/sessao";

export const metadata: Metadata = { title: "Início" };

// Página provisória: a spec `dashboard` troca este conteúdo pelas recomendações.
export default async function DashboardPage() {
  const usuario = await exigirUsuario();

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-3 px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Olá, {usuario.nome}</h1>
      <p className="text-muted-foreground max-w-xl">
        Em breve, aqui vão aparecer as recomendações de filmes feitas para o seu gosto.
      </p>
    </section>
  );
}
