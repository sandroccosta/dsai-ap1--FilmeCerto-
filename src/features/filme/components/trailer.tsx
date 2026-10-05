"use client";

import { Play } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

/** Miniatura do YouTube; o player (sem cookies) só é carregado depois do clique. */
export function Trailer({ chave, titulo }: { chave: string; titulo: string }) {
  const [tocando, setTocando] = useState(false);

  return (
    <div className="bg-muted relative aspect-video w-full max-w-3xl overflow-hidden rounded-xl">
      {tocando ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${chave}?autoplay=1`}
          title={`Trailer de ${titulo}`}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 size-full"
        />
      ) : (
        <button
          type="button"
          onClick={() => setTocando(true)}
          className="group focus-visible:ring-ring/50 absolute inset-0 outline-none focus-visible:ring-3"
        >
          <Image
            src={`https://i.ytimg.com/vi/${chave}/hqdefault.jpg`}
            alt=""
            fill
            sizes="(min-width: 768px) 768px, 100vw"
            className="object-cover opacity-80 transition-opacity group-hover:opacity-100"
          />
          <span className="bg-primary text-primary-foreground absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full px-5 py-3 font-medium shadow-lg">
            <Play className="size-5 fill-current" aria-hidden="true" />
            Assistir trailer
          </span>
        </button>
      )}
    </div>
  );
}
