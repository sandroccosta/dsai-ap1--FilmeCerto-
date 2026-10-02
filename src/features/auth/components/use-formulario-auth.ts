"use client";

import { useActionState, useState, type FormEvent } from "react";
import type { z } from "zod";

import type { EstadoFormulario } from "@/features/auth/estado";

type Action<Campo extends string> = (
  anterior: EstadoFormulario<Campo>,
  formData: FormData,
) => Promise<EstadoFormulario<Campo>>;

/**
 * Liga um formulário a uma Server Action e valida no cliente com o mesmo schema
 * do servidor, para mostrar erros sem ida e volta à rede.
 */
export function useFormularioAuth<Campo extends string>(action: Action<Campo>, schema: z.ZodType) {
  const [estado, formAction, enviando] = useActionState(action, {});
  const [errosCliente, setErrosCliente] = useState<Partial<Record<Campo, string>> | null>(null);

  function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    const dados = Object.fromEntries(new FormData(evento.currentTarget));
    const resultado = schema.safeParse(dados);
    if (resultado.success) {
      setErrosCliente(null);
      return;
    }
    evento.preventDefault();
    const erros: Partial<Record<Campo, string>> = {};
    for (const issue of resultado.error.issues) {
      erros[issue.path[0] as Campo] ??= issue.message;
    }
    setErrosCliente(erros);
  }

  const erros: Partial<Record<Campo, string>> = errosCliente ?? estado.erros ?? {};

  return {
    estado,
    erros,
    // Erro de campo no cliente esconde a mensagem geral antiga do servidor.
    mensagem: errosCliente ? undefined : estado.mensagem,
    formAction,
    enviando,
    aoEnviar,
  };
}
