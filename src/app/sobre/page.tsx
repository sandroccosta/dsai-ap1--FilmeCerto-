import type { Metadata } from "next";
import Image from "next/image";

import { JUSTWATCH_URL, TMDB_ATTRIBUTION, TMDB_URL } from "@/components/layout/tmdb-attribution";

export const metadata: Metadata = {
  title: "Sobre",
};

export default function SobrePage() {
  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-12">
      <header className="flex flex-col gap-3">
        <h1 className="text-4xl tracking-tight sm:text-5xl">Sobre o Filme Certo</h1>
        <p className="text-muted-foreground">
          O Filme Certo recomenda filmes a partir das suas preferências de gênero, duração e
          frequência, e aprende com as notas que você dá. Projeto acadêmico da disciplina de
          Desenvolvimento de Software Apoiado por IA (UFPA, 2026).
        </p>
      </header>

      <section aria-labelledby="creditos" className="flex flex-col gap-4">
        <h2 id="creditos" className="text-2xl tracking-tight">
          Créditos e atribuições
        </h2>

        <div className="border-border bg-card flex flex-col gap-3 rounded-2xl border p-5">
          <a
            href={TMDB_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="The Movie Database (TMDB)"
          >
            <Image src="/tmdb-logo.svg" alt="TMDB" width={154} height={20} />
          </a>
          <p>{TMDB_ATTRIBUTION}</p>
          <p className="text-muted-foreground text-sm">
            Dados de filmes, pôsteres e trailers vêm do The Movie Database (TMDB).
          </p>
        </div>

        <div className="border-border bg-card flex flex-col gap-2 rounded-2xl border p-5">
          <p>
            Os dados de onde assistir são fornecidos pela{" "}
            <a
              href={JUSTWATCH_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline-offset-4 hover:underline"
            >
              JustWatch
            </a>
            .
          </p>
        </div>

        <div className="border-border bg-card flex flex-col gap-2 rounded-2xl border p-5">
          <p>Imagem da página inicial gerada por IA com o GPT-6 (OpenAI).</p>
        </div>
      </section>
    </article>
  );
}
