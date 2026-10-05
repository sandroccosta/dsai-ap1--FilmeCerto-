import { GENEROS } from "@/features/preferencias/generos";
import { filtrosDeDuracao, PERFIS } from "@/features/recomendacao/perfil";
import { sortearInteiro } from "@/features/recomendacao/semente";
import type { ReacaoMotor, EntradaMotor, Gerador } from "@/features/recomendacao/tipos";
import type { FiltrosDescoberta } from "@/lib/tmdb/tipos";

export type Consulta =
  | { tipo: "para-voce"; filtros: FiltrosDescoberta }
  | { tipo: "parecidos"; origem: ReacaoMotor }
  | { tipo: "genero"; generoId: number; filtros: FiltrosDescoberta };

const MAX_ORIGENS_PARECIDOS = 3;

const PRIORIDADE = { amei: 0, gostei: 1 } as const;

/** Reações "Amei" e "Gostei" que viram fonte de parecidos: "Amei" primeiro, até 3. */
export function origensDeParecidos(reacoes: ReacaoMotor[] = []): ReacaoMotor[] {
  return reacoes
    .filter(
      (r): r is ReacaoMotor & { reacao: keyof typeof PRIORIDADE } => r.reacao !== "nao-gostei",
    )
    .sort((a, b) => PRIORIDADE[a.reacao] - PRIORIDADE[b.reacao])
    .slice(0, MAX_ORIGENS_PARECIDOS);
}

export function planejar({ preferencias, reacoes }: EntradaMotor, gerador: Gerador): Consulta[] {
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

  const parecidos: Consulta[] = origensDeParecidos(reacoes).map((origem) => ({
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
