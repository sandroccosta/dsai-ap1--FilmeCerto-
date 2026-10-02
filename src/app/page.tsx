export default function HomePage() {
  return (
    <section className="mx-auto flex max-w-3xl flex-1 flex-col items-center justify-center gap-6 px-4 py-24 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
        Filme <span className="text-primary">Certo</span>
      </h1>
      <p className="text-muted-foreground max-w-xl text-lg">
        Conte do que você gosta e receba recomendações de filmes feitas para o seu gosto, com onde
        assistir no Brasil.
      </p>
    </section>
  );
}
