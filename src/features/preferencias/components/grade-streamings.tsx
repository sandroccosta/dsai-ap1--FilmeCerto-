import { cn } from "cn";
import { CheckIcon } from "lucide-react";
import Image from "next/image";

import { STREAMINGS } from "@/features/preferencias/streamings";
import { urlImagem } from "@/lib/tmdb/imagens";

type Props = {
  titulo: string;
  selecionados: number[];
  aoAlternar: (id: number) => void;
};

/** Os streamings da lista como botões de alternância com logo. Usado no onboarding e no perfil. */
export function GradeStreamings({ titulo, selecionados, aoAlternar }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-xl tracking-tight">{titulo}</h2>
      <p className="text-muted-foreground text-sm">
        Os filmes desses serviços ganham uma seção só deles.
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {STREAMINGS.map(({ id, nome, logoPath }) => {
          const marcado = selecionados.includes(id);
          const logo = urlImagem(logoPath, "w92");
          return (
            <button
              key={id}
              type="button"
              aria-pressed={marcado}
              onClick={() => aoAlternar(id)}
              className={cn(
                "border-border relative flex items-center gap-3 rounded-xl border p-2.5 text-left text-sm transition-colors outline-none",
                "hover:bg-muted focus-visible:ring-ring/50 focus-visible:ring-3",
                marcado && "border-primary bg-primary/10 hover:bg-primary/15",
              )}
            >
              {logo && (
                <Image
                  src={logo}
                  alt=""
                  width={36}
                  height={36}
                  className="size-9 shrink-0 rounded-md"
                />
              )}
              <span className="font-medium">{nome}</span>
              {marcado && (
                <span className="bg-primary text-primary-foreground absolute top-1.5 right-1.5 rounded-full p-0.5">
                  <CheckIcon className="size-3" aria-hidden />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
