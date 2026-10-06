import Image from "next/image";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

const PASSOS = [
  {
    titulo: "Conte seu gosto",
    texto: "Gêneros, duração, streamings e alguns filmes que você ama. Leva poucos minutos.",
  },
  {
    titulo: "Receba sugestões",
    texto: "Seções feitas para você, que mudam conforme você avalia os filmes.",
  },
  {
    titulo: "Veja onde assistir",
    texto: "Cada filme mostra em quais serviços está disponível no Brasil.",
  },
];

// Quem já tem sessão é mandado para /dashboard pelo proxy.
export default function HomePage() {
  return (
    <>
      <section className="relative isolate flex min-h-[min(calc(100svh-4rem),40rem)] items-center overflow-hidden">
        <Image
          src="/sala-escura.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="motion-safe:animate-in motion-safe:fade-in -z-20 object-cover object-[70%_center] motion-safe:duration-1000"
        />
        {/* Escurece o lado do texto (no celular, a imagem toda) e emenda na seção de baixo. */}
        <div className="bg-background/80 md:from-background md:via-background/70 absolute inset-0 -z-10 md:bg-transparent md:bg-gradient-to-r md:to-transparent" />
        <div className="from-background absolute inset-x-0 bottom-0 -z-10 h-32 bg-gradient-to-t" />

        <div className="mx-auto w-full max-w-6xl px-4 py-20">
          <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 flex max-w-xl flex-col gap-6 motion-safe:duration-700">
            <h1 className="text-[clamp(2.75rem,7vw,5.5rem)] leading-[0.95] tracking-tight text-balance">
              O filme certo para hoje à noite
            </h1>
            <p className="text-foreground/80 max-w-md text-lg leading-relaxed">
              Conte o que você curte, o que prefere evitar e quais streamings assina. O Filme Certo
              sugere filmes para o seu gosto e mostra onde assistir no Brasil.
            </p>
            <div className="flex flex-wrap items-center gap-6">
              <Link
                href="/cadastro"
                className={buttonVariants({ size: "lg", className: "h-11 px-6 text-base" })}
              >
                Criar minha conta
              </Link>
              <Link
                href="/sobre"
                className="text-foreground/90 hover:text-primary underline-offset-4 transition-colors hover:underline"
              >
                Sobre o projeto
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="como-funciona"
        className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pt-8 pb-20"
      >
        <h2 id="como-funciona" className="text-3xl tracking-tight sm:text-4xl">
          Como funciona
        </h2>
        <ol className="grid gap-10 sm:grid-cols-3 sm:gap-8">
          {PASSOS.map(({ titulo, texto }, indice) => (
            <li key={titulo} className="flex gap-4">
              <span
                aria-hidden="true"
                className="text-primary text-6xl leading-none font-extrabold [font-stretch:75%]"
              >
                {indice + 1}
              </span>
              <div className="flex flex-col gap-1.5 pt-1">
                <h3 className="text-lg font-semibold">{titulo}</h3>
                <p className="text-muted-foreground leading-relaxed">{texto}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="text-muted-foreground border-border/60 max-w-2xl border-t pt-6 text-sm">
          Projeto acadêmico da disciplina Desenvolvimento de Software Apoiado por IA (UFPA, 2026),
          com dados de filmes do TMDB.
        </p>
      </section>
    </>
  );
}
