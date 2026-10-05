import { Paginacao } from "@/features/busca/components/paginacao";
import { MIN_TEXTO, type Modo } from "@/features/busca/parametros";
import { CartaoFilme } from "@/features/dashboard/components/cartao-filme";
import type { FilmeResumo, Pagina } from "@/lib/tmdb/tipos";

const numeroPtBr = new Intl.NumberFormat("pt-BR");

type Props = {
  modo: Modo;
  texto: string;
  /** `null` quando não houve consulta (texto curto demais no modo nome). */
  resultado: Pagina<FilmeResumo> | null;
  parametros: Record<string, string>;
};

function cabecalho(modo: Modo, total: number, texto: string) {
  const quantidade = numeroPtBr.format(total);
  if (modo === "nome") {
    return `${quantidade} ${total === 1 ? "resultado" : "resultados"} para “${texto}”`;
  }
  return `${quantidade} ${total === 1 ? "filme encontrado" : "filmes encontrados"}`;
}

export function ResultadosBusca({ modo, texto, resultado, parametros }: Props) {
  if (!resultado || (modo === "nome" && texto.length < MIN_TEXTO)) {
    return <p className="text-muted-foreground">Digite o nome de um filme para começar.</p>;
  }

  if (resultado.itens.length === 0) {
    return (
      <p className="text-muted-foreground">
        {modo === "nome"
          ? `Nenhum filme encontrado para “${texto}”.`
          : "Nenhum filme encontrado com esses filtros."}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-muted-foreground">{cabecalho(modo, resultado.totalResultados, texto)}</p>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-6">
        {resultado.itens.map((filme) => (
          <li key={filme.id}>
            <CartaoFilme filme={filme} />
          </li>
        ))}
      </ul>
      <Paginacao
        parametros={parametros}
        pagina={resultado.pagina}
        totalPaginas={resultado.totalPaginas}
      />
    </div>
  );
}
