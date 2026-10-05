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
      <h1 className="text-3xl font-bold tracking-tight">Seu perfil</h1>

      <section aria-labelledby="secao-dados" className="flex flex-col gap-4">
        <h2 id="secao-dados" className="text-xl font-semibold tracking-tight">
          Seus dados
        </h2>
        <FormularioNome nome={usuario.nome} email={usuario.email} />
      </section>

      <section aria-labelledby="secao-preferencias" className="flex flex-col gap-4">
        <h2 id="secao-preferencias" className="text-xl font-semibold tracking-tight">
          Suas preferências
        </h2>
        <FormularioPreferencias atuais={preferencias} />
      </section>
    </div>
  );
}
