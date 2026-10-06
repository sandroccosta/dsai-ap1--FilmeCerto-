import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { buttonVariants } from "@/components/ui/button";
import { exigirUsuario } from "@/features/auth/sessao";
import { EsqueletoSecoes } from "@/features/dashboard/components/esqueleto-secoes";
import { SecoesRecomendadas } from "@/features/dashboard/components/secoes-recomendadas";
import { lerRodada } from "@/features/dashboard/rodada";
import { idsNasListas } from "@/features/listas/consultas";
import { obterPreferencias } from "@/features/preferencias/consultas";
import { resumirPreferencias } from "@/features/preferencias/resumo";
import { obterReacoes } from "@/features/reacoes/consultas";
import {
  EsqueletoSurpresa,
  SurpresaDashboard,
} from "@/features/surpresa/components/surpresa-dashboard";

export const metadata: Metadata = { title: "Início" };

export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const usuario = await exigirUsuario();
  const preferencias = await obterPreferencias();
  if (!preferencias) redirect("/onboarding");

  const rodada = lerRodada((await searchParams).rodada);
  const [reacoes, excluir] = await Promise.all([obterReacoes(), idsNasListas()]);
  const urlAtual = rodada ? `/dashboard?rodada=${rodada}` : "/dashboard";
  const proximaRodada = `/dashboard?rodada=${rodada + 1}`;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-4 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Olá, {usuario.nome}</h1>
          <p className="text-muted-foreground" data-testid="resumo-preferencias">
            {resumirPreferencias(preferencias)}
          </p>
        </div>
        <Link href={proximaRodada} className={buttonVariants({ variant: "outline", size: "lg" })}>
          Gerar outras recomendações
        </Link>
      </header>

      <Suspense fallback={<EsqueletoSurpresa />}>
        <SurpresaDashboard
          preferencias={preferencias}
          excluir={[...excluir, ...reacoes.map((reacao) => reacao.tmdbId)]}
        />
      </Suspense>

      {/* A chave por rodada mostra o esqueleto de novo a cada "Gerar outras recomendações". */}
      <Suspense key={rodada} fallback={<EsqueletoSecoes />}>
        <SecoesRecomendadas
          entrada={{
            preferencias,
            usuarioId: usuario.id,
            data: new Date(),
            rodada,
            reacoes,
            excluir,
          }}
          urlAtual={urlAtual}
          proximaRodada={proximaRodada}
        />
      </Suspense>
    </div>
  );
}
