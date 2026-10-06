import { cn } from "cn";
import { useId } from "react";

import { GENEROS, MAX_GENEROS } from "@/features/preferencias/generos";

type Props = {
  titulo: string;
  selecionados: number[];
  aoAlternar: (id: number) => void;
  /** Gêneros que não aparecem (ex.: os favoritos, na lista de evitados). */
  ocultos?: number[];
  ajuda?: string;
  avisoLimite?: string;
};

/** Os 19 gêneros como botões de alternância, com limite de 5. Usado no onboarding e no perfil. */
export function ChipsGeneros({
  titulo,
  selecionados,
  aoAlternar,
  ocultos = [],
  ajuda = "Escolha de 1 a 5. Eles guiam suas recomendações.",
  avisoLimite = "Você pode escolher até 5 gêneros.",
}: Props) {
  const limiteAtingido = selecionados.length >= MAX_GENEROS;
  const idTitulo = useId();

  return (
    <div role="group" aria-labelledby={idTitulo} className="flex flex-col gap-3">
      <h2 id={idTitulo} className="text-lg font-semibold">
        {titulo}
      </h2>
      <p className="text-muted-foreground text-sm">{limiteAtingido ? avisoLimite : ajuda}</p>
      <div className="flex flex-wrap gap-2">
        {GENEROS.filter(({ id }) => !ocultos.includes(id)).map(({ id, nome }) => {
          const marcado = selecionados.includes(id);
          return (
            <button
              key={id}
              type="button"
              aria-pressed={marcado}
              disabled={!marcado && limiteAtingido}
              onClick={() => aoAlternar(id)}
              className={cn(
                "border-border rounded-full border px-4 py-2 text-sm transition-colors outline-none",
                "hover:bg-muted focus-visible:ring-ring/50 focus-visible:ring-3",
                "disabled:cursor-not-allowed disabled:opacity-40",
                marcado && "border-primary bg-primary text-primary-foreground hover:bg-primary/80",
              )}
            >
              {nome}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Liga/desliga um gênero numa lista. */
export function alternar(lista: number[], id: number): number[] {
  return lista.includes(id) ? lista.filter((atual) => atual !== id) : [...lista, id];
}
