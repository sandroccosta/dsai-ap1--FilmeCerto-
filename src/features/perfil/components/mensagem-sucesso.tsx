import { CircleCheck } from "lucide-react";

export function MensagemSucesso() {
  return (
    <p role="status" className="inline-flex items-center gap-1.5 text-sm text-emerald-400">
      <CircleCheck className="size-4" aria-hidden="true" />
      Alterações salvas.
    </p>
  );
}
