import Image from "next/image";
import type { ReactNode } from "react";

import { formatarDuracao, formatarVotos } from "@/features/filme/formatar";
import { urlImagem } from "@/lib/tmdb/imagens";
import type { FilmeDetalhes } from "@/lib/tmdb/tipos";

export function CabecalhoFilme({ filme, acoes }: { filme: FilmeDetalhes; acoes?: ReactNode }) {
  const fundo = urlImagem(filme.backdropPath, "w1280");
  const poster = urlImagem(filme.posterPath, "w500");
  const dados = [
    filme.ano ? String(filme.ano) : null,
    formatarDuracao(filme.duracaoMin),
    `★ ${filme.nota.toFixed(1)} (${formatarVotos(filme.votos)} votos)`,
  ].filter((item): item is string => item !== null);

  return (
    <div className="relative isolate overflow-hidden rounded-xl">
      {fundo && (
        <Image src={fundo} alt="" fill priority sizes="100vw" className="-z-20 object-cover" />
      )}
      <div className="from-background via-background/90 to-background/40 absolute inset-0 -z-10 bg-gradient-to-t md:bg-gradient-to-r" />

      <div className="flex flex-col gap-6 p-4 sm:p-8 md:flex-row md:items-end">
        <div className="bg-muted relative aspect-[2/3] w-40 shrink-0 overflow-hidden rounded-lg shadow-xl sm:w-52">
          {poster ? (
            <Image src={poster} alt="" fill priority sizes="208px" className="object-cover" />
          ) : (
            <div className="text-muted-foreground flex h-full items-center justify-center p-3 text-center font-medium">
              {filme.titulo}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{filme.titulo}</h1>
            {filme.tituloOriginal && filme.tituloOriginal !== filme.titulo && (
              <p className="text-muted-foreground mt-1">{filme.tituloOriginal}</p>
            )}
          </div>
          <ul className="text-muted-foreground flex flex-wrap gap-x-3 gap-y-1 text-sm">
            {dados.map((item, indice) => (
              <li key={item} className="flex items-center gap-3">
                {indice > 0 && <span aria-hidden="true">·</span>}
                <span>{item}</span>
              </li>
            ))}
          </ul>
          {filme.generos.length > 0 && (
            <ul aria-label="Gêneros" className="flex flex-wrap gap-2">
              {filme.generos.map((genero) => (
                <li
                  key={genero.id}
                  className="border-border bg-background/60 rounded-full border px-3 py-1 text-xs"
                >
                  {genero.nome}
                </li>
              ))}
            </ul>
          )}
          {filme.slogan && <p className="text-muted-foreground italic">{filme.slogan}</p>}
          {/* Reações; listas e "não me interessa" entram aqui nas próximas specs. */}
          <div data-testid="acoes-filme" className="flex flex-wrap gap-2 empty:hidden">
            {acoes}
          </div>
        </div>
      </div>
    </div>
  );
}
