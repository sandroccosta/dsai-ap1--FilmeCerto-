"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { MensagemErro } from "@/features/auth/components/mensagem-erro";
import { atualizarPreferencias } from "@/features/perfil/actions";
import { MensagemSucesso } from "@/features/perfil/components/mensagem-sucesso";
import { alternar, ChipsGeneros } from "@/features/preferencias/components/chips-generos";
import { GrupoOpcoes } from "@/features/preferencias/components/grupo-opcoes";
import {
  DURACOES,
  FREQUENCIAS,
  ROTULOS_DURACAO,
  ROTULOS_FREQUENCIA,
} from "@/features/preferencias/opcoes";
import type { PreferenciasInput } from "@/features/preferencias/schema";

/** As mesmas perguntas do onboarding numa página só, já preenchidas. */
export function FormularioPreferencias({ atuais }: { atuais: PreferenciasInput }) {
  const [estado, formAction, salvando] = useActionState(atualizarPreferencias, {});
  const [generos, setGeneros] = useState(atuais.generos);
  const [duracao, setDuracao] = useState(atuais.duracao);
  const [frequencia, setFrequencia] = useState(atuais.frequencia);

  return (
    <form action={formAction} className="flex flex-col gap-8">
      <MensagemErro mensagem={estado.mensagem} />
      <ChipsGeneros
        titulo="Gêneros favoritos"
        selecionados={generos}
        aoAlternar={(id) => setGeneros((lista) => alternar(lista, id))}
      />
      <div className="grid gap-8 md:grid-cols-2">
        <GrupoOpcoes
          nome="duracao"
          rotulo="Duração preferida"
          opcoes={DURACOES}
          rotulos={ROTULOS_DURACAO}
          valor={duracao}
          aoMudar={setDuracao}
        />
        <GrupoOpcoes
          nome="frequencia"
          rotulo="Com que frequência você assiste filmes?"
          opcoes={FREQUENCIAS}
          rotulos={ROTULOS_FREQUENCIA}
          valor={frequencia}
          aoMudar={setFrequencia}
        />
      </div>

      {generos.map((id) => (
        <input key={id} type="hidden" name="generos" value={id} />
      ))}
      <input type="hidden" name="duracao" value={duracao} />
      <input type="hidden" name="frequencia" value={frequencia} />

      <div className="flex items-center gap-4">
        <Button
          type="submit"
          size="lg"
          className="h-10 px-5"
          disabled={salvando || generos.length === 0}
        >
          {salvando ? "Salvando…" : "Salvar preferências"}
        </Button>
        {estado.ok && !salvando && <MensagemSucesso />}
      </div>
    </form>
  );
}
