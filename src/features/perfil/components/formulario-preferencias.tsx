"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { MensagemErro } from "@/features/auth/components/mensagem-erro";
import { atualizarPreferencias } from "@/features/perfil/actions";
import { MensagemSucesso } from "@/features/perfil/components/mensagem-sucesso";
import { alternar, ChipsGeneros } from "@/features/preferencias/components/chips-generos";
import { GradeStreamings } from "@/features/preferencias/components/grade-streamings";
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
  const [evitados, setEvitados] = useState(atuais.generosEvitados);
  const [streamings, setStreamings] = useState(atuais.streamings);
  const [duracao, setDuracao] = useState(atuais.duracao);
  const [frequencia, setFrequencia] = useState(atuais.frequencia);

  function alternarFavorito(id: number) {
    setGeneros((lista) => alternar(lista, id));
    // Um gênero não pode ser favorito e evitado ao mesmo tempo.
    setEvitados((lista) => lista.filter((evitado) => evitado !== id));
  }

  return (
    <form action={formAction} className="flex flex-col gap-8">
      <MensagemErro mensagem={estado.mensagem} />
      <ChipsGeneros
        titulo="Gêneros favoritos"
        selecionados={generos}
        aoAlternar={alternarFavorito}
      />
      <ChipsGeneros
        titulo="Gêneros que você não quer ver"
        ajuda="Filmes desses gêneros nunca aparecem nas suas recomendações."
        avisoLimite="Você pode evitar até 5 gêneros."
        ocultos={generos}
        selecionados={evitados}
        aoAlternar={(id) => setEvitados((lista) => alternar(lista, id))}
      />
      <GradeStreamings
        titulo="Streamings que você assina"
        selecionados={streamings}
        aoAlternar={(id) => setStreamings((lista) => alternar(lista, id))}
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
      {evitados.map((id) => (
        <input key={id} type="hidden" name="generosEvitados" value={id} />
      ))}
      {streamings.map((id) => (
        <input key={id} type="hidden" name="streamings" value={id} />
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
