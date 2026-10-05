import Image from "next/image";

import { urlImagem } from "@/lib/tmdb/imagens";
import type { MembroElenco } from "@/lib/tmdb/tipos";

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  return (
    (partes[0]?.[0] ?? "") + (partes.length > 1 ? (partes.at(-1)?.[0] ?? "") : "")
  ).toUpperCase();
}

export function Elenco({ pessoas }: { pessoas: MembroElenco[] }) {
  return (
    <ul className="flex [scrollbar-width:thin] gap-4 overflow-x-auto pb-2">
      {pessoas.map((pessoa) => {
        const foto = urlImagem(pessoa.fotoPath, "w185");
        return (
          <li
            key={`${pessoa.nome}-${pessoa.personagem}`}
            className="flex w-28 shrink-0 flex-col gap-2"
          >
            <div className="bg-muted relative aspect-[2/3] overflow-hidden rounded-lg">
              {foto ? (
                <Image src={foto} alt="" fill sizes="112px" className="object-cover" />
              ) : (
                <span
                  aria-hidden="true"
                  className="text-muted-foreground flex h-full items-center justify-center text-xl font-semibold"
                >
                  {iniciais(pessoa.nome)}
                </span>
              )}
            </div>
            <div>
              <p className="text-sm font-medium">{pessoa.nome}</p>
              {pessoa.personagem && (
                <p className="text-muted-foreground text-xs">{pessoa.personagem}</p>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
