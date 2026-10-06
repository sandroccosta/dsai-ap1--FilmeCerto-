import "server-only";

import { GloboSurpresa } from "@/features/surpresa/components/globo-surpresa";
import { montarGlobo } from "@/features/surpresa/montar";
import type { PreferenciasInput } from "@/features/preferencias/schema";
import { descobrirFilmes } from "@/lib/tmdb/filmes";

/** Busca os filmes do globo; se não houver o bastante, o bloco não aparece. */
export async function SurpresaDashboard({
  preferencias,
  excluir,
}: {
  preferencias: PreferenciasInput;
  excluir: number[];
}) {
  const filmes = await montarGlobo({ preferencias, excluir, api: { descobrirFilmes } });
  if (filmes.length === 0) return null;
  return <GloboSurpresa filmes={filmes} />;
}

export function EsqueletoSurpresa() {
  return (
    <div
      aria-hidden="true"
      className="border-border/60 flex h-[26rem] animate-pulse flex-col items-center justify-center gap-6 rounded-2xl border"
    >
      <div className="bg-muted size-48 rounded-full" />
      <div className="bg-muted h-11 w-48 rounded-lg" />
    </div>
  );
}
