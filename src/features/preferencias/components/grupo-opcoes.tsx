import { cn } from "cn";

type GrupoOpcoesProps<Valor extends string> = {
  /** Usado no `name` dos radios e nos ids. */
  nome: string;
  rotulo: string;
  opcoes: readonly Valor[];
  rotulos: Record<Valor, string>;
  valor: Valor | undefined;
  aoMudar: (valor: Valor) => void;
};

/** Escolha única, com radios nativos estilizados como cartões. */
export function GrupoOpcoes<Valor extends string>({
  nome,
  rotulo,
  opcoes,
  rotulos,
  valor,
  aoMudar,
}: GrupoOpcoesProps<Valor>) {
  const idRotulo = `grupo-${nome}`;

  return (
    <div role="radiogroup" aria-labelledby={idRotulo} className="flex flex-col gap-3">
      <h2 id={idRotulo} className="text-lg font-semibold">
        {rotulo}
      </h2>
      {opcoes.map((opcao) => (
        <label
          key={opcao}
          className={cn(
            "border-border hover:bg-muted/50 flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors",
            "has-focus-visible:ring-ring/50 has-focus-visible:ring-3",
            valor === opcao && "border-primary bg-primary/10",
          )}
        >
          <input
            type="radio"
            name={`opcao-${nome}`}
            value={opcao}
            checked={valor === opcao}
            onChange={() => aoMudar(opcao)}
            className="accent-primary size-4"
          />
          <span>{rotulos[opcao]}</span>
        </label>
      ))}
    </div>
  );
}
