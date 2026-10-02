"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { entrar } from "@/features/auth/actions";
import { Campo } from "@/features/auth/components/campo";
import { MensagemErro } from "@/features/auth/components/mensagem-erro";
import { useFormularioAuth } from "@/features/auth/components/use-formulario-auth";
import type { CampoLogin } from "@/features/auth/estado";
import { loginSchema } from "@/features/auth/schema";

export function LoginForm({ next }: { next?: string }) {
  const { estado, erros, mensagem, formAction, enviando, aoEnviar } = useFormularioAuth<CampoLogin>(
    entrar,
    loginSchema,
  );

  return (
    <form action={formAction} onSubmit={aoEnviar} noValidate className="flex flex-col gap-5">
      {next && <input type="hidden" name="next" value={next} />}
      <MensagemErro mensagem={mensagem} />
      <Campo
        name="email"
        rotulo="Email"
        type="email"
        autoComplete="email"
        defaultValue={estado.valores?.email}
        erro={erros.email}
      />
      <Campo
        name="senha"
        rotulo="Senha"
        type="password"
        autoComplete="current-password"
        erro={erros.senha}
      />
      <Button type="submit" size="lg" className="h-10" disabled={enviando}>
        {enviando ? "Entrando…" : "Entrar"}
      </Button>
      <p className="text-muted-foreground text-center text-sm">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="text-primary underline-offset-4 hover:underline">
          Criar conta
        </Link>
      </p>
    </form>
  );
}
