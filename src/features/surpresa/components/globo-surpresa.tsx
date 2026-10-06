"use client";

import { cn } from "cn";
import { Shuffle, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { novoGlobo } from "@/features/surpresa/actions";
import { anguloPara } from "@/features/surpresa/angulo";
import { armazenamentoLocal, lerVistos, registrarVisto } from "@/features/surpresa/memoria";
import type { FilmeGlobo } from "@/features/surpresa/montar";
import { urlImagem } from "@/lib/tmdb/imagens";

const DURACAO_GIRO_MS = 1800;
const VOLTAS_NO_GIRO = 3;
// Quem pede menos movimento ainda vê o giro do sorteio (iniciado por um clique), mais suave.
const VOLTAS_NO_GIRO_SUAVE = 1;
const GRAUS_POR_SEGUNDO_REPOUSO = 9; // uma volta a cada 40 s
export const INTERVALO_RENOVACAO_MS = 2 * 60 * 1000;
const DURACAO_TROCA_MS = 300;
const MINIMO_NO_GLOBO = 3;

/** Sem matchMedia (ambiente de teste), não há como animar: o pop-up abre direto. */
function semAnimacao() {
  return typeof window.matchMedia !== "function";
}

function prefereMenosMovimento() {
  return semAnimacao() || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Raio que deixa os pôsteres (≈ 8 rem) lado a lado num círculo de `total` itens. */
function raioPara(total: number) {
  return Math.round(70 / Math.tan(Math.PI / Math.max(total, 3)));
}

/**
 * Globo de pôsteres que gira e para num filme sorteado, abrindo um pop-up com ele.
 * Não repete filmes: pede um lote novo quando todos já saíram e a cada 2 minutos.
 */
export function GloboSurpresa({ filmes: filmesIniciais }: { filmes: FilmeGlobo[] }) {
  const anel = useRef<HTMLDivElement>(null);
  const dialogo = useRef<HTMLDialogElement>(null);
  const angulo = useRef(0);
  const girando = useRef(false);
  const sorteados = useRef(new Set<number>());
  const [filmes, setFilmes] = useState(filmesIniciais);
  const [trocando, setTrocando] = useState(false);
  const [sorteando, setSorteando] = useState(false);
  const [escolhido, setEscolhido] = useState<FilmeGlobo | null>(null);
  // Conta os sorteios: o mesmo filme pode sair duas vezes seguidas e o pop-up precisa reabrir.
  const [sorteios, setSorteios] = useState(0);
  // Sorteio que espera o lote novo ser desenhado para girar.
  const sorteioPendente = useRef(false);

  const total = filmes.length;
  const passo = 360 / total;
  const raio = raioPara(total);

  const aplicar = useCallback(
    (graus: number, transicao: string) => {
      angulo.current = graus;
      if (!anel.current) return;
      anel.current.style.transition = transicao;
      anel.current.style.transform = `translateZ(${-raio}px) rotateY(${graus}deg)`;
    },
    [raio],
  );

  // Giro lento em repouso.
  useEffect(() => {
    aplicar(angulo.current, "none");
    if (prefereMenosMovimento()) return;
    let quadro = 0;
    let anterior = performance.now();
    const passar = (agora: number) => {
      if (!girando.current) {
        aplicar(angulo.current - ((agora - anterior) / 1000) * GRAUS_POR_SEGUNDO_REPOUSO, "none");
      }
      anterior = agora;
      quadro = requestAnimationFrame(passar);
    };
    quadro = requestAnimationFrame(passar);
    return () => cancelAnimationFrame(quadro);
  }, [aplicar]);

  const jaVistos = useCallback(
    () => [...sorteados.current, ...lerVistos(armazenamentoLocal())],
    [],
  );

  /** Busca um lote novo; `null` se falhar ou vier pequeno demais (o globo atual continua). */
  const buscarLote = useCallback(async () => {
    try {
      const novos = await novoGlobo(jaVistos());
      return novos.length >= MINIMO_NO_GLOBO ? novos : null;
    } catch {
      return null;
    }
  }, [jaVistos]);

  /** Troca os pôsteres com uma transição de opacidade. */
  const trocarLote = useCallback((novos: FilmeGlobo[]) => {
    setTrocando(true);
    window.setTimeout(() => {
      setFilmes(novos);
      setTrocando(false);
    }, DURACAO_TROCA_MS);
  }, []);

  const renovar = useCallback(async () => {
    const novos = await buscarLote();
    if (novos && !girando.current) trocarLote(novos);
  }, [buscarLote, trocarLote]);

  // Renova a cada 2 minutos, só com a aba visível e o globo em repouso.
  useEffect(() => {
    const id = window.setInterval(() => {
      const ocupado = girando.current || dialogo.current?.open;
      if (!ocupado && document.visibilityState === "visible") void renovar();
    }, INTERVALO_RENOVACAO_MS);
    return () => window.clearInterval(id);
  }, [renovar]);

  // Ao montar, se quase todos os filmes já foram sorteados antes (memória de 24 h), renova.
  useEffect(() => {
    const vistos = new Set(lerVistos(armazenamentoLocal()));
    const restantes = filmesIniciais.filter((filme) => !vistos.has(filme.id));
    if (restantes.length < MINIMO_NO_GLOBO) void renovar();
  }, [filmesIniciais, renovar]);

  const abrir = useCallback((filme: FilmeGlobo) => {
    sorteados.current.add(filme.id);
    registrarVisto(armazenamentoLocal(), filme.id);
    setEscolhido(filme);
    setSorteios((n) => n + 1);
    girando.current = false;
    setSorteando(false);
  }, []);

  // O pop-up abre depois que o React renderiza o filme escolhido.
  useEffect(() => {
    const elemento = dialogo.current;
    if (!escolhido || !elemento || elemento.open) return;
    if (typeof elemento.showModal === "function") elemento.showModal();
    else elemento.setAttribute("open", "");
  }, [escolhido, sorteios]);

  function fechar() {
    const elemento = dialogo.current;
    if (elemento?.open) {
      if (typeof elemento.close === "function") elemento.close();
      else elemento.removeAttribute("open");
    }
    setEscolhido(null);
  }

  /** Gira até um filme ainda não sorteado da lista atual e abre o pop-up. */
  const girar = useCallback(
    (lista: FilmeGlobo[]) => {
      const vistos = new Set(jaVistos());
      const livres = lista.map((_, i) => i).filter((i) => !vistos.has(lista[i]!.id));
      // Sem nenhum livre (lote novo falhou), aceita repetir para não travar o botão.
      const opcoes = livres.length > 0 ? livres : lista.map((_, i) => i);
      const indice = opcoes[Math.floor(Math.random() * opcoes.length)]!;
      const filme = lista[indice]!;

      if (semAnimacao() || !anel.current) {
        aplicar(-indice * (360 / lista.length), "none");
        abrir(filme);
        return;
      }

      const elemento = anel.current;
      let concluido = false;
      const concluir = () => {
        if (concluido) return;
        concluido = true;
        elemento.removeEventListener("transitionend", concluir);
        abrir(filme);
      };
      elemento.addEventListener("transitionend", concluir);
      window.setTimeout(concluir, DURACAO_GIRO_MS + 400);
      aplicar(
        anguloPara(
          angulo.current,
          indice,
          lista.length,
          prefereMenosMovimento() ? VOLTAS_NO_GIRO_SUAVE : VOLTAS_NO_GIRO,
        ),
        `transform ${DURACAO_GIRO_MS}ms cubic-bezier(0.12, 0.7, 0.18, 1)`,
      );
    },
    [abrir, aplicar, jaVistos],
  );

  // Quando o lote novo pedido por um sorteio já está na tela, gira.
  useEffect(() => {
    if (!sorteioPendente.current) return;
    sorteioPendente.current = false;
    girar(filmes);
  }, [filmes, girar]);

  async function sortear() {
    if (girando.current) return;
    fechar();
    girando.current = true;
    setSorteando(true);

    const vistos = new Set(jaVistos());
    if (filmes.every((filme) => vistos.has(filme.id))) {
      const novos = await buscarLote();
      if (novos) {
        sorteioPendente.current = true;
        setFilmes(novos);
        return;
      }
    }
    girar(filmes);
  }

  return (
    <section
      aria-labelledby="titulo-surpresa"
      className="border-border/60 flex flex-col items-center gap-6 overflow-hidden rounded-3xl border bg-[radial-gradient(ellipse_at_50%_60%,color-mix(in_oklab,var(--primary)_16%,transparent),transparent_70%)] px-4 py-10"
    >
      <div className="text-center">
        <h2 id="titulo-surpresa" className="text-3xl tracking-tight sm:text-4xl">
          Não sabe o que ver?
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Gire o globo e deixe o Filme Certo escolher.
        </p>
      </div>

      <div
        aria-hidden="true"
        className={cn(
          "relative h-56 w-full transition-opacity duration-300 [perspective:1100px] sm:h-64",
          trocando && "opacity-0",
        )}
      >
        {/* Base do palco, iluminada pela "luz do projetor". */}
        <div className="border-primary/40 bg-primary/5 absolute -bottom-3 left-1/2 h-12 w-[min(92%,34rem)] -translate-x-1/2 rounded-[50%] border shadow-[0_0_56px_-12px_var(--primary)]" />
        <div
          ref={anel}
          data-testid="anel-globo"
          className="absolute top-1/2 left-1/2 h-48 w-32 -translate-x-1/2 -translate-y-1/2 [transform-style:preserve-3d] sm:h-56 sm:w-36"
        >
          {filmes.map((filme, i) => (
            <div
              key={filme.id}
              data-filme={filme.id}
              className="absolute inset-0 overflow-hidden rounded-lg shadow-xl [backface-visibility:hidden]"
              style={{ transform: `rotateY(${i * passo}deg) translateZ(${raio}px)` }}
            >
              <Image
                src={urlImagem(filme.posterPath, "w185") ?? ""}
                alt=""
                fill
                sizes="144px"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      <Button
        size="lg"
        className="h-11 gap-2 px-6 text-base"
        onClick={sortear}
        disabled={sorteando}
      >
        <Shuffle className="size-5" aria-hidden="true" />
        {sorteando ? "Sorteando…" : "Me surpreenda"}
      </Button>

      <dialog
        ref={dialogo}
        aria-labelledby="titulo-sorteado"
        onClose={() => setEscolhido(null)}
        className="bg-card text-foreground border-border m-auto w-[min(92vw,40rem)] rounded-2xl border p-0 shadow-2xl backdrop:bg-black/70"
      >
        {escolhido && (
          <div className="relative flex flex-col gap-5 p-5 sm:flex-row sm:p-6">
            <button
              type="button"
              aria-label="Fechar"
              onClick={fechar}
              className="text-muted-foreground hover:text-foreground absolute top-3 right-3 rounded-full p-1"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
            <div className="bg-muted relative mx-auto aspect-[2/3] w-36 shrink-0 overflow-hidden rounded-lg sm:mx-0 sm:w-44">
              <Image
                src={urlImagem(escolhido.posterPath, "w342") ?? ""}
                alt=""
                fill
                sizes="176px"
                className="object-cover"
              />
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-primary text-xs font-semibold tracking-wide uppercase">
                Sua surpresa de hoje
              </p>
              <h2 id="titulo-sorteado" className="pr-6 text-2xl font-bold tracking-tight">
                {escolhido.titulo}
              </h2>
              <p className="text-muted-foreground text-sm">
                {[escolhido.ano, `★ ${escolhido.nota.toFixed(1)}`].filter(Boolean).join(" · ")}
              </p>
              {escolhido.sinopse && <p className="line-clamp-4 text-sm">{escolhido.sinopse}</p>}
              <p className="text-muted-foreground text-xs">{escolhido.motivo}</p>
              <div className="mt-auto flex flex-wrap gap-2 pt-2">
                <Link href={`/filme/${escolhido.id}`} className={buttonVariants({ size: "lg" })}>
                  Ver detalhes
                </Link>
                <Button variant="outline" size="lg" onClick={sortear}>
                  Sortear outro
                </Button>
              </div>
            </div>
          </div>
        )}
      </dialog>
    </section>
  );
}
