import type { ComponentProps } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CampoProps = Omit<ComponentProps<"input">, "id"> & {
  name: string;
  rotulo: string;
  erro?: string;
};

/** Input com label e mensagem de erro ligada por `aria-describedby`. */
export function Campo({ name, rotulo, erro, ...props }: CampoProps) {
  const id = `campo-${name}`;
  const idErro = `${id}-erro`;

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{rotulo}</Label>
      <Input
        id={id}
        name={name}
        aria-invalid={erro ? true : undefined}
        aria-describedby={erro ? idErro : undefined}
        className="h-10"
        {...props}
      />
      {erro && (
        <p id={idErro} className="text-destructive text-sm">
          {erro}
        </p>
      )}
    </div>
  );
}
