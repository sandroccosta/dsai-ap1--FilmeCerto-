import { GENEROS } from "@/features/preferencias/generos";
import { filtrosDeDuracao, PERFIS } from "@/features/recomendacao/perfil";
import { sortearInteiro } from "@/features/recomendacao/semente";
import type { AvaliacaoMotor, EntradaMotor, Gerador } from "@/features/recomendacao/tipos";
import type { FiltrosDescoberta } from "@/lib/tmdb/tipos";

export type Consulta =
  | { tipo: "para-voce"; filtros: FiltrosDescoberta }
  | { tipo: "parecidos"; origem: AvaliacaoMotor }
  | { tipo: "genero"; generoId: number; filtros: FiltrosDescoberta };

const MAX_ORIGENS_PARECIDOS = 3;

/** Avaliações de 4★ e 5★ que viram fonte de parecidos: as mais altas, até 3. */
export function origensDeParecidos(avaliacoes: AvaliacaoMotor[] = []): AvaliacaoMotor[] {
  return avaliacoes
    .filter((avaliacao) => avaliacao.nota >= 4)
    .sort((a, b) => b.nota - a.nota)
    .slice(0, MAX_ORIGENS_PARECIDOS);
}

export function planejar({ preferencias, avaliacoes }: EntradaMotor, gerador: Gerador): Consulta[] {
  const perfil = PERFIS[preferencias.frequencia];
  const base: FiltrosDescoberta = {
    ...filtrosDeDuracao(preferencias.duracao),
    votosMin: perfil.votosMin,
    notaMin: perfil.notaMin,
    ordem: "popularidade",
  };

  const primeira = sortearInteiro(gerador, 1, perfil.paginaMax);
  let segunda = sortearInteiro(gerador, 1, perfil.paginaMax - 1);
  if (segunda >= primeira) segunda += 1;

  const paraVoce: Consulta[] =
    perfil.paginaMax > 1
      ? [primeira, segunda].map((pagina) => ({
          tipo: "para-voce",
          filtros: { ...base, generos: preferencias.generos, pagina },
        }))
      : (["popularidade", "nota"] as const).map((ordem) => ({
          tipo: "para-voce",
          filtros: { ...base, generos: preferencias.generos, ordem, pagina: 1 },
        }));

  const parecidos: Consulta[] = origensDeParecidos(avaliacoes).map((origem) => ({
    tipo: "parecidos",
    origem,
  }));

  const porGenero: Consulta[] = GENEROS.filter(({ id }) => preferencias.generos.includes(id)).map(
    ({ id }) => ({
      tipo: "genero",
      generoId: id,
      filtros: { ...base, generos: [id], pagina: sortearInteiro(gerador, 1, perfil.paginaMax) },
    }),
  );

  return [...paraVoce, ...parecidos, ...porGenero];
}
