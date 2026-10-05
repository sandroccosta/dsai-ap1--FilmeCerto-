import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

const MAX_PAGINAS_TMDB = 500;

type Props = {
  /** Parâmetros da busca que cada link de página mantém. */
  parametros: Record<string, string>;
  pagina: number;
  totalPaginas: number;
};

export function Paginacao({ parametros, pagina, totalPaginas }: Props) {
  const total = Math.min(totalPaginas, MAX_PAGINAS_TMDB);
  if (total <= 1) return null;

  const href = (numero: number) =>
    `/busca?${new URLSearchParams({ ...parametros, pagina: String(numero) })}`;

  return (
    <nav aria-label="Paginação" className="flex items-center justify-center gap-4 py-4">
      {pagina > 1 && (
        <Link href={href(pagina - 1)} className={buttonVariants({ variant: "outline" })}>
          Anterior
        </Link>
      )}
      <span className="text-muted-foreground text-sm">
        Página {pagina} de {total}
      </span>
      {pagina < total && (
        <Link href={href(pagina + 1)} className={buttonVariants({ variant: "outline" })}>
          Próxima
        </Link>
      )}
    </nav>
  );
}
