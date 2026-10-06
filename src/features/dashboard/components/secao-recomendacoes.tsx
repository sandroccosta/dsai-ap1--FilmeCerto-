import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Carrossel } from "@/features/dashboard/components/carrossel";
import { CartaoFilme } from "@/features/dashboard/components/cartao-filme";
import type { Secao } from "@/features/recomendacao/tipos";

type Props = {
  secao: Secao;
  /** URL atual (com a rodada), usada no "Tentar de novo". */
  urlAtual: string;
};

export function SecaoRecomendacoes({ secao, urlAtual }: Props) {
  const idTitulo = `secao-${secao.id}`;

  return (
    <section aria-labelledby={idTitulo} className="flex flex-col gap-3">
      <h2 id={idTitulo} className="text-2xl tracking-tight">
        {secao.titulo}
      </h2>
      {secao.erro ? (
        <div className="border-border/60 text-muted-foreground flex flex-wrap items-center gap-3 rounded-lg border border-dashed px-4 py-6 text-sm">
          <p>Não foi possível carregar agora.</p>
          <Link href={urlAtual} className={buttonVariants({ variant: "outline", size: "sm" })}>
            Tentar de novo
          </Link>
        </div>
      ) : (
        <Carrossel rotulo={secao.titulo}>
          {secao.filmes.map((filme) => (
            <li key={filme.id} className="shrink-0 snap-start">
              <CartaoFilme filme={filme} />
            </li>
          ))}
        </Carrossel>
      )}
    </section>
  );
}
