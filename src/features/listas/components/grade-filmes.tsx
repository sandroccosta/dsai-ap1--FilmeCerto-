import { Heart, ThumbsDown, ThumbsUp, type LucideIcon } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { CartaoFilme } from "@/features/dashboard/components/cartao-filme";
import type { ItemLista } from "@/features/listas/consultas";
import type { Aba } from "@/features/listas/opcoes";
import { ROTULOS_REACAO, type Reacao } from "@/features/reacoes/opcoes";

const ICONES_REACAO: Record<Reacao, LucideIcon> = {
  "nao-gostei": ThumbsDown,
  gostei: ThumbsUp,
  amei: Heart,
};

const VAZIO: Record<Aba, string> = {
  quero: "Nada por aqui ainda. Marque “Quero assistir” na página de um filme para guardá-lo.",
  assistidos: "Nada por aqui ainda. Marque “Já assisti” nos filmes que você viu.",
};

export function GradeFilmes({ aba, itens }: { aba: Aba; itens: ItemLista[] }) {
  if (itens.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-col items-start gap-3 py-8">
        <p>{VAZIO[aba]}</p>
        <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
          Ver recomendações
        </Link>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-6">
      {itens.map((item) => {
        const Icone = item.reacao ? ICONES_REACAO[item.reacao] : null;
        return (
          <li key={item.tmdbId} className="flex flex-col gap-2">
            <CartaoFilme
              filme={{
                id: item.tmdbId,
                titulo: item.titulo,
                posterPath: item.posterPath,
                ano: item.ano,
              }}
            />
            {Icone && item.reacao && (
              <p className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                <Icone className="size-3.5" aria-hidden="true" />
                {ROTULOS_REACAO[item.reacao]}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
