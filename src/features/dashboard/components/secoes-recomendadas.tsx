import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { SecaoRecomendacoes } from "@/features/dashboard/components/secao-recomendacoes";
import { gerarRecomendacoes } from "@/features/recomendacao/gerar";
import type { EntradaMotor } from "@/features/recomendacao/tipos";

type Props = {
  entrada: EntradaMotor;
  urlAtual: string;
  proximaRodada: string;
};

/** Parte lenta do dashboard: chama o motor e mostra as seções. Fica dentro de um Suspense. */
export async function SecoesRecomendadas({ entrada, urlAtual, proximaRodada }: Props) {
  const secoes = await gerarRecomendacoes(entrada);

  if (secoes.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-col items-start gap-3">
        <p>Não encontramos filmes com essas preferências.</p>
        <Link href={proximaRodada} className={buttonVariants({ variant: "outline" })}>
          Tentar outras recomendações
        </Link>
      </div>
    );
  }

  return secoes.map((secao) => (
    <SecaoRecomendacoes key={secao.id} secao={secao} urlAtual={urlAtual} />
  ));
}
