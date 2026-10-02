import type { Metadata } from "next";

import { LoginForm } from "@/features/auth/components/login-form";
import { sanitizarNext } from "@/features/auth/redirecionamento";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  const destino = typeof next === "string" ? sanitizarNext(next) : undefined;

  return (
    <>
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Entrar</h1>
      <p className="text-muted-foreground mb-6 text-sm">Bom te ver de novo.</p>
      <LoginForm next={destino} />
    </>
  );
}
