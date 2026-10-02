import { randomUUID } from "node:crypto";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

/**
 * Valores do Supabase local (`supabase start`). São públicos e iguais em toda
 * instalação da CLI, não são segredos. Podem ser trocados por variáveis de ambiente.
 */
export const SUPABASE_LOCAL = {
  url: process.env.SUPABASE_LOCAL_URL ?? "http://127.0.0.1:54321",
  publishableKey:
    process.env.SUPABASE_LOCAL_PUBLISHABLE_KEY ?? "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH",
};

export const SENHA_TESTE = "filme1234";

/** Email único por chamada, para os testes não dependerem uns dos outros. */
export function emailAleatorio(prefixo = "teste") {
  return `${prefixo}-${randomUUID()}@filmecerto.test`;
}

/** Cliente sem sessão persistida: cada um representa um usuário diferente. */
export function novoCliente() {
  return createClient<Database>(SUPABASE_LOCAL.url, SUPABASE_LOCAL.publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Cria um usuário com perfil e devolve o cliente já autenticado como ele. */
export async function criarUsuario(nome = "Usuária Teste") {
  const cliente = novoCliente();
  const email = emailAleatorio();
  const { data, error } = await cliente.auth.signUp({
    email,
    password: SENHA_TESTE,
    options: { data: { nome } },
  });
  if (error || !data.user) throw error ?? new Error("signUp não devolveu usuário");
  return { cliente, id: data.user.id, email };
}
