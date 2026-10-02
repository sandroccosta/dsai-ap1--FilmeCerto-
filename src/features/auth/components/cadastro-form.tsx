"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cadastrar } from "@/features/auth/actions";
import { Campo } from "@/features/auth/components/campo";
import { MensagemErro } from "@/features/auth/components/mensagem-erro";
import { useFormularioAuth } from "@/features/auth/components/use-formulario-auth";
import type { CampoCadastro } from "@/features/auth/estado";
import { cadastroSchema } from "@/features/auth/schema";

export function CadastroForm() {
  const { estado, erros, mensagem, formAction, enviando, aoEnviar } =
    useFormularioAuth<CampoCadastro>(cadastrar, cadastroSchema);

  return (
    <form action={formAction} onSubmit={aoEnviar} noValidate className="flex flex-col gap-5">
      <MensagemErro mensagem={mensagem} />
      <Campo
        name="nome"
        rotulo="Nome"
        autoComplete="name"
        defaultValue={estado.valores?.nome}
        erro={erros.nome}
      />
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
        autoComplete="new-password"
        erro={erros.senha}
      />
      <Campo
        name="confirmacao"
        rotulo="Confirme a senha"
        type="password"
        autoComplete="new-password"
        erro={erros.confirmacao}
      />
      <Button type="submit" size="lg" className="h-10" disabled={enviando}>
        {enviando ? "Criando conta…" : "Criar conta"}
      </Button>
      <p className="text-muted-foreground text-center text-sm">
        Já tem conta?{" "}
        <Link href="/login" className="text-primary underline-offset-4 hover:underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}
