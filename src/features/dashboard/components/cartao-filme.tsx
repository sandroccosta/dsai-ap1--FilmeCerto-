import Image from "next/image";
import Link from "next/link";

import { urlImagem } from "@/lib/tmdb/imagens";
import type { FilmeResumo } from "@/lib/tmdb/tipos";

/** Card de filme; o motivo só aparece quando o filme veio do motor de recomendação. */
export function CartaoFilme({ filme }: { filme: FilmeResumo & { motivo?: string } }) {
  const poster = urlImagem(filme.posterPath, "w342");
  const nome = filme.ano ? `${filme.titulo} (${filme.ano})` : filme.titulo;
  const detalhes = [filme.ano, `★ ${filme.nota.toFixed(1)}`].filter(Boolean).join(" · ");

  return (
    <Link
      href={`/filme/${filme.id}`}
      aria-label={nome}
      className="group focus-visible:ring-ring/50 flex w-40 flex-col gap-2 rounded-lg outline-none focus-visible:ring-3 md:w-44"
    >
      <div className="bg-muted relative aspect-[2/3] overflow-hidden rounded-lg">
        {poster ? (
          <Image
            src={poster}
            alt=""
            fill
            sizes="(min-width: 768px) 176px, 160px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div
            data-testid="sem-poster"
            className="text-muted-foreground flex h-full items-center justify-center p-3 text-center text-sm font-medium"
          >
            {filme.titulo}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-0.5">
        <p className="truncate text-sm font-medium">{filme.titulo}</p>
        <p className="text-muted-foreground text-xs">{detalhes}</p>
        {filme.motivo && (
          <p data-testid="motivo" className="text-muted-foreground line-clamp-2 text-xs">
            {filme.motivo}
          </p>
        )}
      </div>
    </Link>
  );
}
