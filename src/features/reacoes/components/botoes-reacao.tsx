"use client";

import { cn } from "cn";
import { Heart, ThumbsDown, ThumbsUp, type LucideIcon } from "lucide-react";
import { useActionState, useState } from "react";

import { alternarReacao } from "@/features/reacoes/actions";
import { REACOES, ROTULOS_REACAO, type Reacao } from "@/features/reacoes/opcoes";

const ICONES: Record<Reacao, LucideIcon> = {
  "nao-gostei": ThumbsDown,
  gostei: ThumbsUp,
  amei: Heart,
};

/**
 * "Não é pra mim", "Gostei" e "Amei". Cada botão envia um formulário (funciona sem JS);
 * com JS, o destaque muda na hora e volta atrás se a ação falhar.
 */
export function BotoesReacao({ tmdbId, atual }: { tmdbId: number; atual: Reacao | null }) {
  const [estado, formAction, enviando] = useActionState(alternarReacao, {});
  // Enquanto a ação roda, mostra o resultado esperado; depois, vale o que veio do servidor.
  const [palpite, setPalpite] = useState<Reacao | null>(atual);
  const exibida = enviando ? palpite : atual;

  return (
    <div className="flex flex-col gap-2">
      <div role="group" aria-label="O que achou?" className="flex flex-wrap gap-2">
        {REACOES.map((reacao) => {
          const Icone = ICONES[reacao];
          const marcada = exibida === reacao;
          return (
            <form
              key={reacao}
              action={formAction}
              onSubmit={() => setPalpite(atual === reacao ? null : reacao)}
            >
              <input type="hidden" name="tmdbId" value={tmdbId} />
              <input type="hidden" name="reacao" value={reacao} />
              <button
                type="submit"
                aria-pressed={marcada}
                disabled={enviando}
                className={cn(
                  "border-border bg-background/60 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors outline-none",
                  "hover:bg-muted focus-visible:ring-ring/50 focus-visible:ring-3 disabled:opacity-70",
                  marcada &&
                    "border-primary bg-primary text-primary-foreground hover:bg-primary/80",
                )}
              >
                <Icone className={cn("size-4", marcada && reacao === "amei" && "fill-current")} />
                {ROTULOS_REACAO[reacao]}
              </button>
            </form>
          );
        })}
      </div>
      {estado.mensagem && (
        <p role="alert" className="text-destructive text-sm">
          {estado.mensagem}
        </p>
      )}
    </div>
  );
}
