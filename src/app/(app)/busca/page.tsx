import type { Metadata } from "next";

import {
  AbasBusca,
  FormularioFiltros,
  FormularioNome,
} from "@/features/busca/components/formularios-busca";
import { ResultadosBusca } from "@/features/busca/components/resultados-busca";
import {
  filtrosParaDescoberta,
  lerBusca,
  MIN_TEXTO,
  parametrosDaBusca,
} from "@/features/busca/parametros";
import { buscarFilmes, descobrirFilmes } from "@/lib/tmdb/filmes";

export async function generateMetadata({ searchParams }: PageProps<"/busca">): Promise<Metadata> {
  const { modo, texto } = lerBusca(await searchParams);
  return {
    title: modo === "nome" && texto.length >= MIN_TEXTO ? `Busca: ${texto}` : "Buscar filmes",
  };
}

export default async function BuscaPage({ searchParams }: PageProps<"/busca">) {
  const busca = lerBusca(await searchParams);
  const { modo, texto, pagina, filtros } = busca;

  const resultado =
    modo === "filtros"
      ? await descobrirFilmes(filtrosParaDescoberta(filtros, pagina))
      : texto.length >= MIN_TEXTO
        ? await buscarFilmes(texto, pagina)
        : null;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Buscar filmes</h1>
      <AbasBusca ativa={modo} />
      {modo === "nome" ? <FormularioNome texto={texto} /> : <FormularioFiltros filtros={filtros} />}
      <ResultadosBusca
        modo={modo}
        texto={texto}
        resultado={resultado}
        parametros={parametrosDaBusca(busca)}
      />
    </div>
  );
}
