import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { exigirUsuario } from "@/features/auth/sessao";
import { FormularioNome } from "@/features/perfil/components/formulario-nome";
import { FormularioPreferencias } from "@/features/perfil/components/formulario-preferencias";
import { obterPreferencias } from "@/features/preferencias/consultas";

export const metadata: Metadata = { title: "Seu perfil" };

export default async function PerfilPage() {
  const usuario = await exigirUsuario();
  const preferencias = await obterPreferencias();
  if (!preferencias) redirect("/onboarding");

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-10 px-4 py-10">
      <header className="border-border bg-card flex items-center gap-5 rounded-2xl border p-5 sm:p-6">
        <span
          aria-hidden="true"
          className="bg-primary text-primary-foreground flex size-16 shrink-0 items-center justify-center rounded-full text-3xl font-extrabold [font-stretch:75%]"
        >
          {(usuario.nome.trim()[0] ?? usuario.email[0] ?? "?").toUpperCase()}
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-4xl tracking-tight">Seu perfil</h1>
          <p className="text-muted-foreground truncate">
            {usuario.nome} ({usuario.email})
          </p>
        </div>
      </header>

      <section aria-labelledby="secao-dados" className="flex flex-col gap-4">
        <h2 id="secao-dados" className="text-2xl tracking-tight">
          Seus dados
        </h2>
        <FormularioNome nome={usuario.nome} email={usuario.email} />
      </section>

      <section aria-labelledby="secao-preferencias" className="flex flex-col gap-4">
        <h2 id="secao-preferencias" className="text-2xl tracking-tight">
          Suas preferências
        </h2>
        <FormularioPreferencias atuais={preferencias} />
      </section>
    </div>
  );
}
