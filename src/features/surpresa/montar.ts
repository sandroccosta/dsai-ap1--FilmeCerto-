import { GENEROS } from "@/features/preferencias/generos";
import type { PreferenciasInput } from "@/features/preferencias/schema";
import { motivoPorGeneros } from "@/features/recomendacao/motivo";
import { filtrosDeDuracao, PERFIS } from "@/features/recomendacao/perfil";
import type { ApiFilmes } from "@/lib/tmdb/filmes";
import type { FilmeResumo } from "@/lib/tmdb/tipos";

export type ApiGlobo = Pick<ApiFilmes, "descobrirFilmes">;

export type FilmeGlobo = Pick<FilmeResumo, "id" | "titulo" | "ano" | "nota" | "sinopse"> & {
  posterPath: string;
  motivo: string;
  origem: "gosto" | "bolha";
};

type Entrada = {
  preferencias: PreferenciasInput;
  excluir?: number[];
  api: ApiGlobo;
  /** Gerador em [0, 1); injetável para os testes. */
  aleatorio?: () => number;
};

const POR_ORIGEM = 6;
const GENEROS_BOLHA = 3;
const MINIMO_NO_GLOBO = 3;
const BOLHA = { notaMin: 6.5, votosMin: 500, paginaMax: 5 };

function inteiroEntre(aleatorio: () => number, min: number, max: number) {
  return min + Math.floor(aleatorio() * (max - min + 1));
}

/** Fisher–Yates com o gerador recebido. */
function embaralhar<T>(lista: T[], aleatorio: () => number): T[] {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1));
    [copia[i], copia[j]] = [copia[j]!, copia[i]!];
  }
  return copia;
}

type Filtros = NonNullable<Parameters<ApiGlobo["descobrirFilmes"]>[0]>;

async function consultar(api: ApiGlobo, filtros: Filtros): Promise<FilmeResumo[]> {
  try {
    const itens = (await api.descobrirFilmes(filtros)).itens;
    // Gostos de nicho têm poucas páginas no TMDB: se a sorteada não existe, usa a 1ª por nota
    // (os carrosséis ordenam por popularidade, então ainda são filmes diferentes).
    if (itens.length === 0 && (filtros.pagina ?? 1) > 1) {
      return (await api.descobrirFilmes({ ...filtros, pagina: 1, ordem: "nota" })).itens;
    }
    return itens;
  } catch (erro) {
    console.error("[surpresa] consulta falhou:", erro);
    return [];
  }
}

/**
 * Até 6 filmes do gosto da pessoa (de páginas que os carrosséis não usam) e até 6
 * de gêneros que ela não escolheu, bem avaliados. Lista vazia se sobrarem menos de 3.
 */
export async function montarGlobo({
  preferencias,
  excluir = [],
  api,
  aleatorio = Math.random,
}: Entrada): Promise<FilmeGlobo[]> {
  const perfil = PERFIS[preferencias.frequencia];
  const favoritos = preferencias.generos;
  const generosBolha = embaralhar(
    GENEROS.map(({ id }) => id).filter((id) => !favoritos.includes(id)),
    aleatorio,
  ).slice(0, GENEROS_BOLHA);

  const [doGosto, daBolha] = await Promise.all([
    consultar(api, {
      generos: favoritos,
      ...filtrosDeDuracao(preferencias.duracao),
      votosMin: perfil.votosMin,
      notaMin: perfil.notaMin,
      ordem: "popularidade",
      pagina: inteiroEntre(aleatorio, perfil.paginaMax + 1, perfil.paginaMax + 5),
    }),
    consultar(api, {
      generos: generosBolha,
      semGeneros: favoritos,
      notaMin: BOLHA.notaMin,
      votosMin: BOLHA.votosMin,
      ordem: "popularidade",
      pagina: inteiroEntre(aleatorio, 1, BOLHA.paginaMax),
    }),
  ]);

  const vistos = new Set(excluir);
  function escolher(filmes: FilmeResumo[]) {
    const validos = filmes.filter((filme) => {
      if (!filme.posterPath || vistos.has(filme.id)) return false;
      vistos.add(filme.id);
      return true;
    });
    return embaralhar(validos, aleatorio).slice(0, POR_ORIGEM);
  }

  const nomeDoGenero = (filme: FilmeResumo) =>
    GENEROS.find(({ id }) => filme.generos.includes(id) && generosBolha.includes(id))?.nome ??
    "um gênero novo";

  const globo: FilmeGlobo[] = [
    ...escolher(doGosto).map((filme) => ({
      ...resumo(filme),
      motivo: motivoPorGeneros(filme.generos, favoritos),
      origem: "gosto" as const,
    })),
    ...escolher(daBolha).map((filme) => ({
      ...resumo(filme),
      motivo: `Fora da sua bolha: ${nomeDoGenero(filme)} bem avaliado`,
      origem: "bolha" as const,
    })),
  ];

  return globo.length < MINIMO_NO_GLOBO ? [] : embaralhar(globo, aleatorio);
}

function resumo(filme: FilmeResumo) {
  return {
    id: filme.id,
    titulo: filme.titulo,
    ano: filme.ano,
    nota: filme.nota,
    sinopse: filme.sinopse,
    posterPath: filme.posterPath ?? "",
  };
}
