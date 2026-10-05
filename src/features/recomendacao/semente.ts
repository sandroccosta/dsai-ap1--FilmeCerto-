import type { Gerador } from "@/features/recomendacao/tipos";

const formatoDia = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Sao_Paulo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Data no formato AAAA-MM-DD, no fuso de São Paulo. */
export function diaEmSaoPaulo(data: Date): string {
  return formatoDia.format(data);
}

/** Hash FNV-1a de 32 bits. */
function hash(texto: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Mulberry32: gerador pequeno, rápido e determinístico. */
function mulberry32(semente: number): Gerador {
  let estado = semente;
  return () => {
    estado = (estado + 0x6d2b79f5) | 0;
    let t = estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Mesmo usuário, mesmo dia e mesma rodada sempre produzem a mesma sequência. */
export function criarGerador(usuarioId: string, data: Date, rodada: number): Gerador {
  return mulberry32(hash(`${usuarioId}|${diaEmSaoPaulo(data)}|${rodada}`));
}

/** Inteiro entre `min` e `max`, inclusive. */
export function sortearInteiro(gerador: Gerador, min: number, max: number): number {
  return min + Math.floor(gerador() * (max - min + 1));
}
