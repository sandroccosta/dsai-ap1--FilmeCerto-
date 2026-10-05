"use client";

import { cn } from "cn";
import { Bookmark, Check, type LucideIcon } from "lucide-react";
import { useActionState, useState } from "react";

import { alternarLista } from "@/features/listas/actions";
import { ROTULOS_STATUS, STATUS_LISTA, type StatusLista } from "@/features/listas/opcoes";

const ICONES: Record<StatusLista, LucideIcon> = {
  quero_assistir: Bookmark,
  assistido: Check,
};

/** "Quero assistir" e "Já assisti"; mesmo padrão dos botões de reação. */
export function BotoesLista({ tmdbId, atual }: { tmdbId: number; atual: StatusLista | null }) {
  const [estado, formAction, enviando] = useActionState(alternarLista, {});
  // Enquanto a ação roda, mostra o resultado esperado; depois, vale o que veio do servidor.
  const [palpite, setPalpite] = useState<StatusLista | null>(atual);
  const exibido = enviando ? palpite : atual;

  return (
    <div className="flex flex-col gap-2">
      <div role="group" aria-label="Minhas listas" className="flex flex-wrap gap-2">
        {STATUS_LISTA.map((status) => {
          const Icone = ICONES[status];
          const marcado = exibido === status;
          return (
            <form
              key={status}
              action={formAction}
              onSubmit={() => setPalpite(atual === status ? null : status)}
            >
              <input type="hidden" name="tmdbId" value={tmdbId} />
              <input type="hidden" name="status" value={status} />
              <button
                type="submit"
                aria-pressed={marcado}
                disabled={enviando}
                className={cn(
                  "border-border bg-background/60 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors outline-none",
                  "hover:bg-muted focus-visible:ring-ring/50 focus-visible:ring-3 disabled:opacity-70",
                  marcado &&
                    "border-foreground bg-foreground text-background hover:bg-foreground/80",
                )}
              >
                <Icone
                  className={cn("size-4", marcado && status === "quero_assistir" && "fill-current")}
                />
                {ROTULOS_STATUS[status]}
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
