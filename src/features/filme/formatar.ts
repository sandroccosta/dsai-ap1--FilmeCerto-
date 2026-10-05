/** "2h 19min", "2h", "45min"; `null` para duração ausente. */
export function formatarDuracao(minutos: number | null): string | null {
  if (!minutos) return null;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  if (!horas) return `${resto}min`;
  return resto ? `${horas}h ${resto}min` : `${horas}h`;
}

const numeroPtBr = new Intl.NumberFormat("pt-BR");

export function formatarVotos(votos: number): string {
  return numeroPtBr.format(votos);
}
