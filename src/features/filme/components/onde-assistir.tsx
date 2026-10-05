import { ExternalLink } from "lucide-react";
import Image from "next/image";

import { urlImagem } from "@/lib/tmdb/imagens";
import type { OndeAssistir as Dados, Provedor } from "@/lib/tmdb/tipos";

const GRUPOS = [
  { chave: "assinatura", titulo: "Assinatura" },
  { chave: "aluguel", titulo: "Aluguel" },
  { chave: "compra", titulo: "Compra" },
] as const;

function Provedores({ titulo, provedores }: { titulo: string; provedores: Provedor[] }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-muted-foreground text-sm font-medium">{titulo}</h3>
      <ul className="flex flex-wrap gap-3">
        {provedores.map((provedor) => {
          const logo = urlImagem(provedor.logoPath, "w92");
          return (
            <li key={provedor.id} className="flex items-center gap-2">
              {logo ? (
                <Image
                  src={logo}
                  alt={provedor.nome}
                  width={36}
                  height={36}
                  className="rounded-md"
                />
              ) : (
                <span aria-hidden="true" className="bg-muted size-9 rounded-md" />
              )}
              <span className="text-sm">{provedor.nome}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function OndeAssistir({ dados }: { dados: Dados | null }) {
  const grupos = GRUPOS.filter(({ chave }) => dados && dados[chave].length > 0);

  if (!dados || grupos.length === 0) {
    return (
      <p className="text-muted-foreground">Não encontramos onde assistir este filme no Brasil.</p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {grupos.map(({ chave, titulo }) => (
        <Provedores key={chave} titulo={titulo} provedores={dados[chave]} />
      ))}
      <a
        href={dados.link}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary inline-flex w-fit items-center gap-1 text-sm underline-offset-4 hover:underline"
      >
        Ver todas as opções <ExternalLink className="size-3.5" aria-hidden="true" />
      </a>
      <p className="text-muted-foreground text-xs">
        Dados de onde assistir fornecidos por JustWatch.
      </p>
    </div>
  );
}
