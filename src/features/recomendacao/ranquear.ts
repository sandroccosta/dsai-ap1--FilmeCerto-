import type { Reacao } from "@/features/reacoes/opcoes";
import type { Gerador, ReacaoMotor } from "@/features/recomendacao/tipos";
import type { FilmeResumo } from "@/lib/tmdb/tipos";

const PESO_POR_REACAO: Record<Reacao, number> = {
  amei: 0.1,
  gostei: 0.05,
  "nao-gostei": -0.1,
};

const DESEMPATE_MAX = 0.02;

/** Soma, por gênero, o peso das reações dadas a filmes daquele gênero. */
export function bonusPorGenero(reacoes: ReacaoMotor[] = []): Map<number, number> {
  const bonus = new Map<number, number>();
  for (const { reacao, generos } of reacoes) {
    for (const genero of generos) {
      bonus.set(genero, (bonus.get(genero) ?? 0) + PESO_POR_REACAO[reacao]);
    }
  }
  return bonus;
}

type Contexto = {
  favoritos: number[];
  bonus: Map<number, number>;
  gerador: Gerador;
};

function afinidade(filme: FilmeResumo, { favoritos, bonus }: Contexto): number {
  const total = Math.max(1, filme.generos.length);
  const emComum = filme.generos.filter((genero) => favoritos.includes(genero)).length;
  const extra = filme.generos.reduce((soma, genero) => soma + (bonus.get(genero) ?? 0), 0) / total;
  return Math.min(1, Math.max(0, emComum / total + extra));
}

/**
 * pontuacao = 0.5 afinidade + 0.3 nota + 0.2 popularidade + desempate,
 * com a popularidade normalizada em escala log pela maior da lista.
 * Devolve os filmes em ordem decrescente de pontuação.
 */
export function pontuar<F extends FilmeResumo>(
  filmes: F[],
  contexto: Contexto,
): (F & { pontuacao: number })[] {
  const maiorPopularidade = Math.max(0, ...filmes.map((filme) => filme.popularidade));
  const escala = Math.log10(1 + maiorPopularidade) || 1;

  // O sorteio do desempate segue a ordem dos IDs, para não depender da ordem da API.
  const desempate = new Map(
    [...filmes]
      .sort((a, b) => a.id - b.id)
      .map((filme) => [filme.id, contexto.gerador() * DESEMPATE_MAX]),
  );

  return filmes
    .map((filme) => ({
      ...filme,
      pontuacao:
        0.5 * afinidade(filme, contexto) +
        0.3 * (filme.nota / 10) +
        0.2 * (Math.log10(1 + filme.popularidade) / escala) +
        (desempate.get(filme.id) ?? 0),
    }))
    .sort((a, b) => b.pontuacao - a.pontuacao);
}
