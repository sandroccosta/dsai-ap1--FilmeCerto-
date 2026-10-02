export const DESTINO_PADRAO = "/dashboard";

/**
 * Aceita só caminhos internos (`/algo`) como destino depois do login, para que
 * `?next=` não possa mandar o usuário para outro site (open redirect).
 */
export function sanitizarNext(valor: string | null | undefined): string {
  if (!valor || !valor.startsWith("/") || valor.startsWith("//")) return DESTINO_PADRAO;
  // Navegadores tratam `\` como `/` e ignoram tabs e quebras de linha em URLs.
  if (/[\\\s]/.test(valor)) return DESTINO_PADRAO;
  return valor;
}
