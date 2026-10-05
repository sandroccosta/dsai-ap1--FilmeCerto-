import type { AvaliacaoMotor } from "@/features/recomendacao/tipos";
import type { FilmeResumo } from "@/lib/tmdb/tipos";

const PESO_ORIGEM: Partial<Record<AvaliacaoMotor["nota"], number>> = { 5: 1, 4: 0.6 };
const MAX_POR_SECAO = 20;

export type ListaDeParecidos = { origem: AvaliacaoMotor; filmes: FilmeResumo[] };
export type SecaoParecidos = {
  origem: AvaliacaoMotor;
  filmes: (FilmeResumo & { peso: number })[];
};

/**
 * Junta as recomendações do TMDB de cada filme bem avaliado. Cada candidato soma
 * `peso da origem × (1 − posição / tamanho da lista)` em todas as listas em que aparece,
 * e fica na seção da origem que mais contribuiu para ele.
 */
export function agregarParecidos(
  listas: ListaDeParecidos[],
  excluir: ReadonlySet<number>,
): SecaoParecidos[] {
  const avaliados = new Set(listas.map(({ origem }) => origem.tmdbId));
  const candidatos = new Map<
    number,
    { filme: FilmeResumo; peso: number; melhorOrigem: AvaliacaoMotor; melhorContribuicao: number }
  >();

  for (const { origem, filmes } of listas) {
    const pesoOrigem = PESO_ORIGEM[origem.nota] ?? 0;
    filmes.forEach((filme, posicao) => {
      if (excluir.has(filme.id) || avaliados.has(filme.id)) return;
      const contribuicao = pesoOrigem * (1 - posicao / filmes.length);
      const atual = candidatos.get(filme.id);
      if (!atual) {
        candidatos.set(filme.id, {
          filme,
          peso: contribuicao,
          melhorOrigem: origem,
          melhorContribuicao: contribuicao,
        });
        return;
      }
      atual.peso += contribuicao;
      if (contribuicao > atual.melhorContribuicao) {
        atual.melhorOrigem = origem;
        atual.melhorContribuicao = contribuicao;
      }
    });
  }

  const ordenados = [...candidatos.values()].sort((a, b) => b.peso - a.peso);
  const secoes = new Map<number, SecaoParecidos>();
  for (const { filme, peso, melhorOrigem } of ordenados) {
    const secao = secoes.get(melhorOrigem.tmdbId) ?? { origem: melhorOrigem, filmes: [] };
    if (secao.filmes.length < MAX_POR_SECAO) secao.filmes.push({ ...filme, peso });
    secoes.set(melhorOrigem.tmdbId, secao);
  }
  // A ordem de inserção já segue o candidato mais bem colocado de cada origem.
  return [...secoes.values()];
}
