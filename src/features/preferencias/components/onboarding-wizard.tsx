"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { MensagemErro } from "@/features/auth/components/mensagem-erro";
import { salvarPreferencias } from "@/features/preferencias/actions";
import { alternar, ChipsGeneros } from "@/features/preferencias/components/chips-generos";
import { GrupoOpcoes } from "@/features/preferencias/components/grupo-opcoes";
import {
  DURACOES,
  FREQUENCIAS,
  ROTULOS_DURACAO,
  ROTULOS_FREQUENCIA,
  type Duracao,
  type Frequencia,
} from "@/features/preferencias/opcoes";

const TOTAL_PASSOS = 3;

export function OnboardingWizard() {
  const [estado, formAction, salvando] = useActionState(salvarPreferencias, {});
  const [passo, setPasso] = useState(1);
  const [generos, setGeneros] = useState<number[]>([]);
  const [duracao, setDuracao] = useState<Duracao>();
  const [frequencia, setFrequencia] = useState<Frequencia>();

  const passoValido =
    (passo === 1 && generos.length > 0) ||
    (passo === 2 && duracao !== undefined) ||
    (passo === 3 && frequencia !== undefined);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground text-sm">
          Passo {passo} de {TOTAL_PASSOS}
        </p>
        <div
          role="progressbar"
          aria-label="Progresso do onboarding"
          aria-valuemin={1}
          aria-valuemax={TOTAL_PASSOS}
          aria-valuenow={passo}
          className="bg-muted h-1.5 overflow-hidden rounded-full"
        >
          <div
            className="bg-primary h-full transition-all"
            style={{ width: `${(passo / TOTAL_PASSOS) * 100}%` }}
          />
        </div>
      </div>

      <MensagemErro mensagem={estado.mensagem} />

      {passo === 1 && (
        <ChipsGeneros
          titulo="Quais gêneros você mais curte?"
          selecionados={generos}
          aoAlternar={(id) => setGeneros((atuais) => alternar(atuais, id))}
        />
      )}

      {passo === 2 && (
        <GrupoOpcoes
          nome="duracao"
          rotulo="Duração preferida"
          opcoes={DURACOES}
          rotulos={ROTULOS_DURACAO}
          valor={duracao}
          aoMudar={setDuracao}
        />
      )}

      {passo === 3 && (
        <GrupoOpcoes
          nome="frequencia"
          rotulo="Com que frequência você assiste filmes?"
          opcoes={FREQUENCIAS}
          rotulos={ROTULOS_FREQUENCIA}
          valor={frequencia}
          aoMudar={setFrequencia}
        />
      )}

      {generos.map((id) => (
        <input key={id} type="hidden" name="generos" value={id} />
      ))}
      {duracao && <input type="hidden" name="duracao" value={duracao} />}
      {frequencia && <input type="hidden" name="frequencia" value={frequencia} />}

      <div className="flex justify-between gap-3">
        {passo > 1 ? (
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="h-10 px-5"
            onClick={() => setPasso(passo - 1)}
          >
            Voltar
          </Button>
        ) : (
          <span />
        )}
        {passo < TOTAL_PASSOS ? (
          <Button
            key="proximo"
            type="button"
            size="lg"
            className="h-10 px-5"
            disabled={!passoValido}
            onClick={() => setPasso(passo + 1)}
          >
            Próximo
          </Button>
        ) : (
          <Button
            key="concluir"
            type="submit"
            size="lg"
            className="h-10 px-5"
            disabled={!passoValido || salvando}
          >
            {salvando ? "Salvando…" : "Concluir"}
          </Button>
        )}
      </div>
    </form>
  );
}
