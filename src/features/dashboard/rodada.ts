const RODADA_MAX = 9999;

/** Lê `?rodada=` da URL: inteiro de 0 a 9999; qualquer outra coisa vira 0. */
export function lerRodada(valor: string | string[] | undefined): number {
  if (typeof valor !== "string" || !/^\d+$/.test(valor)) return 0;
  const rodada = Number(valor);
  return rodada <= RODADA_MAX ? rodada : 0;
}
