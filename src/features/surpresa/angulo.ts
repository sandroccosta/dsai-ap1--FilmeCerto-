/**
 * Ângulo final do anel (rotateY, em graus) para que o item `indice` de `total`
 * pare de frente, girando `voltas` voltas completas a partir de `atual`.
 * O item `i` fica em `i × 360/total`; ele está de frente quando
 * `angulo + i × 360/total` é múltiplo de 360.
 */
export function anguloPara(atual: number, indice: number, total: number, voltas = 3): number {
  const passo = 360 / total;
  const inicio = atual - voltas * 360;
  const sobra = (((inicio + indice * passo) % 360) + 360) % 360;
  return inicio - sobra;
}
