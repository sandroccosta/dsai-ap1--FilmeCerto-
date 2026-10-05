"use client";

import { useActionState, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Campo } from "@/features/auth/components/campo";
import { MensagemErro } from "@/features/auth/components/mensagem-erro";
import { nomeSchema } from "@/features/auth/schema";
import { atualizarNome } from "@/features/perfil/actions";
import { MensagemSucesso } from "@/features/perfil/components/mensagem-sucesso";

export function FormularioNome({ nome, email }: { nome: string; email: string }) {
  const [estado, formAction, salvando] = useActionState(atualizarNome, {});
  const [erroCliente, setErroCliente] = useState<string | null>(null);

  function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    const resultado = nomeSchema.safeParse(new FormData(evento.currentTarget).get("nome") ?? "");
    if (resultado.success) {
      setErroCliente(null);
      return;
    }
    evento.preventDefault();
    setErroCliente(resultado.error.issues[0]?.message ?? null);
  }

  return (
    <form
      action={formAction}
      onSubmit={aoEnviar}
      noValidate
      className="flex max-w-md flex-col gap-4"
    >
      <MensagemErro mensagem={estado.mensagem} />
      <Campo
        name="nome"
        rotulo="Nome"
        autoComplete="name"
        defaultValue={nome}
        erro={erroCliente ?? estado.erroNome}
      />
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">Email</p>
        <p className="text-muted-foreground text-sm">{email}</p>
        <p className="text-muted-foreground text-xs">Não é possível alterar o email.</p>
      </div>
      <div className="flex items-center gap-4">
        <Button type="submit" size="lg" className="h-10 px-5" disabled={salvando}>
          {salvando ? "Salvando…" : "Salvar nome"}
        </Button>
        {estado.ok && !erroCliente && !salvando && <MensagemSucesso />}
      </div>
    </form>
  );
}
