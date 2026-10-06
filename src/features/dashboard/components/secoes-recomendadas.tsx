import Link from "next/link";
import type { ReactNode } from "react";

import { buttonVariants } from "@/components/ui/button";
import { SecaoRecomendacoes } from "@/features/dashboard/components/secao-recomendacoes";
import { gerarRecomendacoes } from "@/features/recomendacao/gerar";
import type { EntradaMotor } from "@/features/recomendacao/tipos";

type Props = {
  entrada: EntradaMotor;
  urlAtual: string;
  proximaRodada: string;
  /** Bloco que entra no meio das seções (o "Me surpreenda"). */
  meio?: ReactNode;
};

/** O bloco do meio entra depois desta quantidade de seções (ou no fim, se houver menos). */
const SECOES_ANTES_DO_MEIO = 2;

/** Parte lenta do dashboard: chama o motor e mostra as seções. Fica dentro de um Suspense. */
export async function SecoesRecomendadas({ entrada, urlAtual, proximaRodada, meio }: Props) {
  const secoes = await gerarRecomendacoes(entrada);

  if (secoes.length === 0) {
    return (
      <>
        <div className="text-muted-foreground flex flex-col items-start gap-3">
          <p>Não encontramos filmes com essas preferências.</p>
          <Link href={proximaRodada} className={buttonVariants({ variant: "outline" })}>
            Tentar outras recomendações
          </Link>
        </div>
        {meio}
      </>
    );
  }

  const secao = (item: (typeof secoes)[number]) => (
    <SecaoRecomendacoes key={item.id} secao={item} urlAtual={urlAtual} />
  );
  return (
    <>
      {secoes.slice(0, SECOES_ANTES_DO_MEIO).map(secao)}
      {meio}
      {secoes.slice(SECOES_ANTES_DO_MEIO).map(secao)}
    </>
  );
}
