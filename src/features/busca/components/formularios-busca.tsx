import { cn } from "cn";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ORDENS, type FiltrosBusca, type Modo } from "@/features/busca/parametros";
import { GENEROS } from "@/features/preferencias/generos";
import { ROTULOS_DURACAO, type Duracao } from "@/features/preferencias/opcoes";
import type { OrdemDescoberta } from "@/lib/tmdb/tipos";

const ROTULOS_ORDEM: Record<OrdemDescoberta, string> = {
  popularidade: "Mais populares",
  nota: "Mais bem avaliados",
  lancamento: "Lançamentos",
};

const DURACOES_FILTRO: Duracao[] = ["indiferente", "curta", "media", "longa"];

const estiloSelect =
  "border-input bg-background dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 h-10 w-full rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3";

export function AbasBusca({ ativa }: { ativa: Modo }) {
  const abas: { modo: Modo; rotulo: string; href: string }[] = [
    { modo: "nome", rotulo: "Por nome", href: "/busca" },
    { modo: "filtros", rotulo: "Por filtros", href: "/busca?modo=filtros" },
  ];
  return (
    <nav aria-label="Modo de busca" className="border-border flex gap-1 border-b">
      {abas.map(({ modo, rotulo, href }) => (
        <Link
          key={modo}
          href={href}
          aria-current={modo === ativa ? "page" : undefined}
          className={cn(
            "-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors",
            modo === ativa
              ? "border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground border-transparent",
          )}
        >
          {rotulo}
        </Link>
      ))}
    </nav>
  );
}

export function FormularioNome({ texto }: { texto: string }) {
  return (
    <form action="/busca" method="get" role="search" className="flex flex-wrap items-end gap-3">
      <div className="flex min-w-48 flex-1 flex-col gap-2">
        <Label htmlFor="busca-q">Nome do filme</Label>
        <Input id="busca-q" name="q" type="search" defaultValue={texto} className="h-10" />
      </div>
      <Button type="submit" size="lg" className="h-10 px-5">
        Buscar
      </Button>
    </form>
  );
}

export function FormularioFiltros({ filtros }: { filtros: FiltrosBusca }) {
  return (
    <form
      action="/busca"
      method="get"
      className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 lg:grid-cols-1"
    >
      <input type="hidden" name="modo" value="filtros" />
      <div className="flex flex-col gap-2">
        <Label htmlFor="filtro-genero">Gênero</Label>
        <select
          id="filtro-genero"
          name="genero"
          defaultValue={filtros.genero ?? ""}
          className={estiloSelect}
        >
          <option value="">Todos</option>
          {GENEROS.map(({ id, nome }) => (
            <option key={id} value={id}>
              {nome}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="filtro-ano">Ano de lançamento</Label>
        <Input
          id="filtro-ano"
          name="ano"
          type="number"
          inputMode="numeric"
          min={1888}
          placeholder="Qualquer"
          defaultValue={filtros.ano ?? ""}
          className="h-10"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="filtro-duracao">Duração</Label>
        <select
          id="filtro-duracao"
          name="duracao"
          defaultValue={filtros.duracao}
          className={estiloSelect}
        >
          {DURACOES_FILTRO.map((duracao) => (
            <option key={duracao} value={duracao}>
              {ROTULOS_DURACAO[duracao]}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="filtro-ordem">Ordenar por</Label>
        <select
          id="filtro-ordem"
          name="ordem"
          defaultValue={filtros.ordem}
          className={estiloSelect}
        >
          {ORDENS.map((ordem) => (
            <option key={ordem} value={ordem}>
              {ROTULOS_ORDEM[ordem]}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" size="lg" className="h-10 px-5">
        Aplicar filtros
      </Button>
    </form>
  );
}
