"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";

/**
 * Lista com rolagem horizontal nativa (toque, trackpad e teclado funcionam sem JS).
 * No desktop, as setas rolam cerca de uma largura visível.
 */
export function Carrossel({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  const lista = useRef<HTMLUListElement>(null);
  const [noInicio, setNoInicio] = useState(true);
  const [noFim, setNoFim] = useState(false);

  const atualizar = useCallback(() => {
    const elemento = lista.current;
    if (!elemento) return;
    setNoInicio(elemento.scrollLeft <= 1);
    setNoFim(elemento.scrollLeft + elemento.clientWidth >= elemento.scrollWidth - 1);
  }, []);

  useEffect(() => {
    atualizar();
    window.addEventListener("resize", atualizar);
    return () => window.removeEventListener("resize", atualizar);
  }, [atualizar]);

  function rolar(direcao: 1 | -1) {
    const elemento = lista.current;
    if (!elemento) return;
    elemento.scrollBy({ left: direcao * elemento.clientWidth * 0.9, behavior: "smooth" });
  }

  return (
    <div className="relative">
      <ul
        ref={lista}
        onScroll={atualizar}
        className="flex snap-x snap-mandatory [scrollbar-width:none] gap-4 overflow-x-auto scroll-smooth pb-2 [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </ul>
      <div className="pointer-events-none absolute inset-y-0 -right-2 -left-2 hidden items-start justify-between pt-28 md:flex">
        <Button
          variant="secondary"
          size="icon"
          aria-label={`Anterior em ${rotulo}`}
          disabled={noInicio}
          onClick={() => rolar(-1)}
          className="pointer-events-auto rounded-full shadow-md disabled:invisible"
        >
          <ChevronLeft />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          aria-label={`Próximo em ${rotulo}`}
          disabled={noFim}
          onClick={() => rolar(1)}
          className="pointer-events-auto rounded-full shadow-md disabled:invisible"
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
