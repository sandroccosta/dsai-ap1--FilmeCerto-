import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";

import { Carrossel } from "@/features/dashboard/components/carrossel";
import { CartaoFilme } from "@/features/dashboard/components/cartao-filme";
import { CabecalhoFilme } from "@/features/filme/components/cabecalho-filme";
import { Elenco } from "@/features/filme/components/elenco";
import { OndeAssistir } from "@/features/filme/components/onde-assistir";
import { Trailer } from "@/features/filme/components/trailer";
import { BotoesReacao } from "@/features/reacoes/components/botoes-reacao";
import { obterReacao } from "@/features/reacoes/consultas";
import { obterFilme } from "@/lib/tmdb/filmes";

/** Só inteiros positivos de até 10 dígitos são IDs válidos do TMDB. */
function lerId(valor: string): number | null {
  if (!/^\d{1,10}$/.test(valor)) return null;
  const id = Number(valor);
  return id > 0 ? id : null;
}

/** Uma busca por renderização, compartilhada entre a página e o título da aba. */
const buscarFilme = cache(async (valor: string) => {
  const id = lerId(valor);
  return id ? obterFilme(id) : null;
});

export async function generateMetadata({ params }: PageProps<"/filme/[id]">): Promise<Metadata> {
  const filme = await buscarFilme((await params).id);
  if (!filme) return { title: "Filme não encontrado" };
  return { title: filme.ano ? `${filme.titulo} (${filme.ano})` : filme.titulo };
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold tracking-tight">{titulo}</h2>
      {children}
    </section>
  );
}

export default async function FilmePage({ params }: PageProps<"/filme/[id]">) {
  const filme = await buscarFilme((await params).id);
  if (!filme) notFound();
  const reacao = await obterReacao(filme.id);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-4 py-8">
      <Link
        href="/dashboard"
        className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> Voltar
      </Link>

      <CabecalhoFilme
        filme={filme}
        acoes={<BotoesReacao key={reacao ?? "nenhuma"} tmdbId={filme.id} atual={reacao} />}
      />

      <Secao titulo="Sinopse">
        <p className="max-w-3xl leading-relaxed">
          {filme.sinopse || "Sinopse não disponível em português."}
        </p>
        {filme.direcao.length > 0 && (
          <p className="text-muted-foreground text-sm">Direção: {filme.direcao.join(", ")}</p>
        )}
      </Secao>

      {filme.trailerYoutube && (
        <Secao titulo="Trailer">
          <Trailer chave={filme.trailerYoutube} titulo={filme.titulo} />
        </Secao>
      )}

      <Secao titulo="Onde assistir no Brasil">
        <OndeAssistir dados={filme.ondeAssistir} />
      </Secao>

      {filme.elenco.length > 0 && (
        <Secao titulo="Elenco">
          <Elenco pessoas={filme.elenco} />
        </Secao>
      )}

      {filme.parecidos.length > 0 && (
        <section aria-labelledby="titulo-parecidos" className="flex flex-col gap-4">
          <h2 id="titulo-parecidos" className="text-xl font-semibold tracking-tight">
            Filmes parecidos
          </h2>
          <Carrossel rotulo="Filmes parecidos">
            {filme.parecidos.map((parecido) => (
              <li key={parecido.id} className="shrink-0 snap-start">
                <CartaoFilme filme={parecido} />
              </li>
            ))}
          </Carrossel>
        </section>
      )}
    </div>
  );
}
