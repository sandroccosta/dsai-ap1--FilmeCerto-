import { GENEROS } from "@/features/preferencias/generos";
import { VERBO_REACAO } from "@/features/reacoes/opcoes";
import type { ReacaoMotor } from "@/features/recomendacao/tipos";

const MAX_GENEROS_NO_MOTIVO = 3;

function listar(nomes: string[]): string {
  if (nomes.length <= 1) return nomes.join("");
  return `${nomes.slice(0, -1).join(", ")} e ${nomes.at(-1)}`;
}

/** "Porque você curte Drama e Thriller", com no máximo 3 gêneros, na ordem de GENEROS. */
export function motivoPorGeneros(generosDoFilme: number[], favoritos: number[]): string {
  const emComum = GENEROS.filter(
    ({ id }) => generosDoFilme.includes(id) && favoritos.includes(id),
  ).map(({ nome }) => nome);
  if (emComum.length === 0) return "Popular entre quem tem gostos parecidos";
  return `Porque você curte ${listar(emComum.slice(0, MAX_GENEROS_NO_MOTIVO))}`;
}

/** "Parecido com X, que você amou". */
export function motivoParecido(origem: ReacaoMotor): string {
  const verbo = origem.reacao === "nao-gostei" ? null : VERBO_REACAO[origem.reacao];
  return verbo ? `Parecido com ${origem.titulo}, ${verbo.motivo}` : `Parecido com ${origem.titulo}`;
}

/** "Porque você amou X" / "Porque você gostou de X". */
export function tituloParecidos(origem: ReacaoMotor): string {
  const verbo = origem.reacao === "nao-gostei" ? null : VERBO_REACAO[origem.reacao];
  return verbo ? `${verbo.titulo} ${origem.titulo}` : `Parecidos com ${origem.titulo}`;
}
