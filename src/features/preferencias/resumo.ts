import { GENEROS } from "@/features/preferencias/generos";
import { ROTULOS_DURACAO, ROTULOS_FREQUENCIA } from "@/features/preferencias/opcoes";
import type { PreferenciasInput } from "@/features/preferencias/schema";

/** Ex.: "Ação, Drama · Médios (90 a 120 min) · Toda semana". */
export function resumirPreferencias({
  generos,
  duracao,
  frequencia,
}: Pick<PreferenciasInput, "generos" | "duracao" | "frequencia">): string {
  const nomes = GENEROS.filter((genero) => generos.includes(genero.id)).map((g) => g.nome);
  return [nomes.join(", "), ROTULOS_DURACAO[duracao], ROTULOS_FREQUENCIA[frequencia]].join(" · ");
}
