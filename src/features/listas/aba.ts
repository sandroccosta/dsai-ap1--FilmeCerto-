import type { Aba } from "@/features/listas/opcoes";

/** Lê `?aba=` da URL; qualquer valor diferente de "assistidos" abre "Quero assistir". */
export function lerAba(valor: string | string[] | undefined): Aba {
  return valor === "assistidos" ? "assistidos" : "quero";
}
