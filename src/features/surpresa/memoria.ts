/** Filmes já sorteados no "Me surpreenda", guardados no navegador por 24 h. */

export const CHAVE_MEMORIA = "filme-certo:surpresa-vistos";
export const MAX_VISTOS = 200;
const VALIDADE_MS = 24 * 60 * 60 * 1000;

type Entrada = { id: number; em: number };
type Armazenamento = Pick<Storage, "getItem" | "setItem">;

function ler(armazenamento: Armazenamento): Entrada[] {
  try {
    const bruto = JSON.parse(armazenamento.getItem(CHAVE_MEMORIA) ?? "[]");
    return Array.isArray(bruto)
      ? bruto.filter(
          (e): e is Entrada => Number.isInteger(e?.id) && e.id > 0 && Number.isFinite(e?.em),
        )
      : [];
  } catch {
    return [];
  }
}

/** IDs sorteados nas últimas 24 h (lista vazia se o navegador não deixar ler). */
export function lerVistos(armazenamento: Armazenamento | undefined, agora = Date.now()): number[] {
  if (!armazenamento) return [];
  return ler(armazenamento)
    .filter((e) => agora - e.em < VALIDADE_MS)
    .map((e) => e.id);
}

/** Guarda um sorteio, mantendo só as 200 entradas mais recentes e válidas. */
export function registrarVisto(
  armazenamento: Armazenamento | undefined,
  id: number,
  agora = Date.now(),
): void {
  if (!armazenamento) return;
  try {
    const entradas = ler(armazenamento).filter((e) => e.id !== id && agora - e.em < VALIDADE_MS);
    entradas.push({ id, em: agora });
    armazenamento.setItem(CHAVE_MEMORIA, JSON.stringify(entradas.slice(-MAX_VISTOS)));
  } catch {
    // Sem localStorage (modo privado, bloqueio): vale só a regra da sessão.
  }
}

/** Acesso seguro ao localStorage: `undefined` quando o navegador bloqueia. */
export function armazenamentoLocal(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

/** Limpa IDs vindos do navegador: só inteiros positivos, sem repetidos, no máximo 200. */
export function limparIds(valor: unknown): number[] {
  if (!Array.isArray(valor)) return [];
  const ids = valor.filter((id): id is number => Number.isInteger(id) && id > 0);
  return [...new Set(ids)].slice(0, MAX_VISTOS);
}
