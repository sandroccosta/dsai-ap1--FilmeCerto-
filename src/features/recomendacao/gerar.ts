import "server-only";

import { GENEROS } from "@/features/preferencias/generos";
import { motivoParecido, motivoPorGeneros, tituloParecidos } from "@/features/recomendacao/motivo";
import { agregarParecidos } from "@/features/recomendacao/parecidos";
import { planejar, type Consulta } from "@/features/recomendacao/planejar";
import { bonusPorGenero, pontuar } from "@/features/recomendacao/ranquear";
import { criarGerador } from "@/features/recomendacao/semente";
import type { EntradaMotor, Recomendacao, Secao } from "@/features/recomendacao/tipos";
import { descobrirFilmes, recomendacoesDe, type ApiFilmes } from "@/lib/tmdb/filmes";
import type { FilmeResumo } from "@/lib/tmdb/tipos";

export type ApiMotor = Pick<ApiFilmes, "descobrirFilmes" | "recomendacoesDe">;

const API_PADRAO: ApiMotor = { descobrirFilmes, recomendacoesDe };
const MAX_POR_SECAO = 20;

type Resultado = { consulta: Consulta; filmes: FilmeResumo[] | null };

async function executar(consulta: Consulta, api: ApiMotor): Promise<Resultado> {
  try {
    const pagina =
      consulta.tipo === "parecidos"
        ? await api.recomendacoesDe(consulta.origem.tmdbId)
        : await api.descobrirFilmes(consulta.filtros);
    return { consulta, filmes: pagina.itens };
  } catch (erro) {
    console.error(`[recomendacao] consulta ${consulta.tipo} falhou:`, erro);
    return { consulta, filmes: null };
  }
}

function semRepetidos(filmes: FilmeResumo[]): FilmeResumo[] {
  return [...new Map(filmes.map((filme) => [filme.id, filme])).values()];
}

/**
 * Monta as seções de recomendação: "Escolhidos para você", os parecidos com filmes
 * bem avaliados e uma por gênero favorito. Cada filme aparece numa única seção.
 */
export async function gerarRecomendacoes(
  entrada: EntradaMotor,
  api: ApiMotor = API_PADRAO,
): Promise<Secao[]> {
  const { preferencias, reacoes = [] } = entrada;
  const gerador = criarGerador(entrada.usuarioId, entrada.data, entrada.rodada ?? 0);
  const plano = planejar(entrada, gerador);
  const resultados = await Promise.all(plano.map((consulta) => executar(consulta, api)));

  // Filmes com qualquer reação já foram vistos: não voltam como recomendação.
  const bloqueados = new Set([...(entrada.excluir ?? []), ...reacoes.map((r) => r.tmdbId)]);
  const usados = new Set<number>();
  const contexto = { favoritos: preferencias.generos, bonus: bonusPorGenero(reacoes), gerador };

  function escolher(filmes: FilmeResumo[]): Recomendacao[] {
    const livres = semRepetidos(filmes).filter((f) => !bloqueados.has(f.id) && !usados.has(f.id));
    const escolhidos = pontuar(livres, contexto)
      .slice(0, MAX_POR_SECAO)
      .map((filme) => ({
        ...filme,
        motivo: motivoPorGeneros(filme.generos, preferencias.generos),
      }));
    for (const filme of escolhidos) usados.add(filme.id);
    return escolhidos;
  }

  const secoes: Secao[] = [];

  const paraVoce = resultados.filter((r) => r.consulta.tipo === "para-voce");
  const filmesParaVoce = paraVoce.flatMap((r) => r.filmes ?? []);
  if (paraVoce.every((r) => r.filmes === null)) {
    secoes.push({ id: "para-voce", titulo: "Escolhidos para você", filmes: [], erro: true });
  } else {
    secoes.push({
      id: "para-voce",
      titulo: "Escolhidos para você",
      filmes: escolher(filmesParaVoce),
    });
  }

  const listasParecidos = resultados.flatMap((r) =>
    r.consulta.tipo === "parecidos" && r.filmes
      ? [{ origem: r.consulta.origem, filmes: r.filmes }]
      : [],
  );
  const jaUsados = new Set([...bloqueados, ...usados]);
  for (const { origem, filmes } of agregarParecidos(listasParecidos, jaUsados)) {
    const recomendacoes = filmes.map(({ peso, ...filme }) => ({
      ...filme,
      motivo: motivoParecido(origem),
      pontuacao: peso,
    }));
    for (const filme of recomendacoes) usados.add(filme.id);
    secoes.push({
      id: `parecidos-${origem.tmdbId}`,
      titulo: tituloParecidos(origem),
      filmes: recomendacoes,
    });
  }

  for (const resultado of resultados) {
    if (resultado.consulta.tipo !== "genero") continue;
    const { generoId } = resultado.consulta;
    const nome = GENEROS.find((genero) => genero.id === generoId)?.nome ?? "Filmes";
    const base = { id: `genero-${generoId}`, titulo: `${nome} para você` };
    if (resultado.filmes === null) {
      secoes.push({ ...base, filmes: [], erro: true });
      continue;
    }
    secoes.push({ ...base, filmes: escolher(resultado.filmes) });
  }

  return secoes.filter((secao) => secao.erro || secao.filmes.length > 0);
}
