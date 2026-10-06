"use client";

import { cn } from "cn";
import { CheckIcon, XIcon } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  buscarFilmesOnboarding,
  sugerirFilmesOnboarding,
  type FilmeOpcao,
  type ResultadoFilmes,
} from "@/features/preferencias/filmes-onboarding";
import { MAX_FILMES_ONBOARDING, MAX_PAGINA_SUGESTOES } from "@/features/preferencias/schema";
import { urlImagem } from "@/lib/tmdb/imagens";

type Props = {
  titulo: string;
  subtitulo: string;
  /** Filtros da grade sugerida (`sugerirFilmesOnboarding`). */
  filtros: { generos?: number[]; semGeneros?: number[] };
  /** Mostra o campo de busca por nome. */
  comBusca?: boolean;
  /** Mostra o botão "Mostrar outros filmes", que troca a grade pela próxima página. */
  comTroca?: boolean;
  selecionados: FilmeOpcao[];
  aoAlternar: (filme: FilmeOpcao) => void;
  /** IDs que não aparecem na grade (ex.: os já marcados em outro passo). */
  ocultos?: number[];
};

type Estado =
  { status: "carregando" } | { status: "erro" } | { status: "ok"; filmes: FilmeOpcao[] };

const ESPERA_BUSCA_MS = 400;
const MIN_CARACTERES_BUSCA = 2;

function paraEstado(resultado: ResultadoFilmes): Estado {
  return "erro" in resultado ? { status: "erro" } : { status: "ok", filmes: resultado.filmes };
}

/** Grade de pôsteres para marcar até 5 filmes, com busca opcional. Passos 6 e 7 do onboarding. */
export function GradeFilmes({
  titulo,
  subtitulo,
  filtros,
  comBusca = false,
  comTroca = false,
  selecionados,
  aoAlternar,
  ocultos = [],
}: Props) {
  const chave = JSON.stringify(filtros);
  const [tentativa, setTentativa] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [sugeridos, setSugeridos] = useState<Estado>({ status: "carregando" });
  const [texto, setTexto] = useState("");
  const [buscados, setBuscados] = useState<Estado>({ status: "carregando" });

  const termo = texto.trim();
  const buscando = comBusca && termo.length >= MIN_CARACTERES_BUSCA;

  useEffect(() => {
    let ativo = true;
    sugerirFilmesOnboarding({ ...JSON.parse(chave), pagina }).then((resultado) => {
      if (ativo) setSugeridos(paraEstado(resultado));
    });
    return () => {
      ativo = false;
    };
  }, [chave, pagina, tentativa]);

  useEffect(() => {
    if (!buscando) return;
    let ativo = true;
    const espera = setTimeout(() => {
      buscarFilmesOnboarding(termo).then((resultado) => {
        if (ativo) setBuscados(paraEstado(resultado));
      });
    }, ESPERA_BUSCA_MS);
    return () => {
      ativo = false;
      clearTimeout(espera);
    };
  }, [buscando, termo, tentativa]);

  const estado = buscando ? buscados : sugeridos;
  const marcados = new Set(selecionados.map((filme) => filme.id));
  const limiteAtingido = selecionados.length >= MAX_FILMES_ONBOARDING;

  function mostrarOutros() {
    setSugeridos({ status: "carregando" });
    // Os marcados continuam na faixa "Filmes marcados" mesmo saindo da grade.
    setPagina((atual) => (atual % MAX_PAGINA_SUGESTOES) + 1);
  }

  function tentarDeNovo() {
    setSugeridos({ status: "carregando" });
    setBuscados({ status: "carregando" });
    setTentativa((atual) => atual + 1);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xl tracking-tight">{titulo}</h2>
        <p className="text-muted-foreground shrink-0 text-sm" aria-live="polite">
          {selecionados.length} de {MAX_FILMES_ONBOARDING}
        </p>
      </div>
      <p className="text-muted-foreground text-sm">{subtitulo}</p>

      {comBusca && (
        <Input
          type="search"
          aria-label="Buscar um filme"
          placeholder="Buscar um filme"
          value={texto}
          onChange={(evento) => {
            setTexto(evento.target.value);
            setBuscados({ status: "carregando" });
          }}
        />
      )}

      {selecionados.length > 0 && (
        <ul aria-label="Filmes marcados" className="flex flex-wrap gap-2">
          {selecionados.map((filme) => (
            <li
              key={filme.id}
              className="bg-primary/15 flex items-center gap-1 rounded-full py-1 pr-1 pl-3 text-sm"
            >
              <span>{filme.titulo}</span>
              <button
                type="button"
                aria-label={`Desmarcar ${filme.titulo}`}
                onClick={() => aoAlternar(filme)}
                className="hover:bg-primary/25 focus-visible:ring-ring/50 rounded-full p-1 outline-none focus-visible:ring-3"
              >
                <XIcon className="size-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      {estado.status === "carregando" && (
        <p className="text-muted-foreground text-sm" role="status">
          Carregando filmes…
        </p>
      )}

      {estado.status === "erro" && (
        <div className="flex flex-col items-start gap-2" role="alert">
          <p className="text-sm">Não foi possível carregar os filmes.</p>
          <Button type="button" variant="outline" size="sm" onClick={tentarDeNovo}>
            Tentar de novo
          </Button>
        </div>
      )}

      {estado.status === "ok" && (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {estado.filmes
            .filter((filme) => !ocultos.includes(filme.id))
            .map((filme) => {
              const marcado = marcados.has(filme.id);
              return (
                <li key={filme.id}>
                  <button
                    type="button"
                    aria-pressed={marcado}
                    aria-label={`Marcar ${filme.titulo}`}
                    title={filme.ano ? `${filme.titulo} (${filme.ano})` : filme.titulo}
                    disabled={!marcado && limiteAtingido}
                    onClick={() => aoAlternar(filme)}
                    className={cn(
                      "bg-muted relative block aspect-[2/3] w-full overflow-hidden rounded-lg border-2 border-transparent outline-none",
                      "focus-visible:ring-ring/50 transition-opacity focus-visible:ring-3",
                      "disabled:cursor-not-allowed disabled:opacity-40",
                      marcado && "border-primary",
                    )}
                  >
                    <Image
                      src={urlImagem(filme.posterPath, "w185") ?? ""}
                      alt=""
                      fill
                      sizes="(min-width: 768px) 120px, 30vw"
                      className="object-cover"
                    />
                    {marcado && (
                      <span className="bg-primary text-primary-foreground absolute top-1.5 right-1.5 rounded-full p-1">
                        <CheckIcon className="size-3.5" aria-hidden />
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
        </ul>
      )}

      {comTroca && !buscando && estado.status !== "erro" && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-center"
          disabled={estado.status === "carregando"}
          onClick={mostrarOutros}
        >
          Mostrar outros filmes
        </Button>
      )}
    </div>
  );
}
