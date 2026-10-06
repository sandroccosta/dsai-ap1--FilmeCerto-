"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { MensagemErro } from "@/features/auth/components/mensagem-erro";
import { salvarPreferencias } from "@/features/preferencias/actions";
import { alternar, ChipsGeneros } from "@/features/preferencias/components/chips-generos";
import { GradeFilmes } from "@/features/preferencias/components/grade-filmes";
import { GradeStreamings } from "@/features/preferencias/components/grade-streamings";
import { GrupoOpcoes } from "@/features/preferencias/components/grupo-opcoes";
import type { FilmeOpcao } from "@/features/preferencias/filmes-onboarding";
import {
  DURACOES,
  FREQUENCIAS,
  ROTULOS_DURACAO,
  ROTULOS_FREQUENCIA,
  type Duracao,
  type Frequencia,
} from "@/features/preferencias/opcoes";

const TOTAL_PASSOS = 7;

function alternarFilme(lista: FilmeOpcao[], filme: FilmeOpcao): FilmeOpcao[] {
  return lista.some(({ id }) => id === filme.id)
    ? lista.filter(({ id }) => id !== filme.id)
    : [...lista, filme];
}

function Ocultos({ nome, valores }: { nome: string; valores: (number | string)[] }) {
  return valores.map((valor) => <input key={valor} type="hidden" name={nome} value={valor} />);
}

export function OnboardingWizard() {
  const [estado, formAction, salvando] = useActionState(salvarPreferencias, {});
  const [passo, setPasso] = useState(1);
  const [generos, setGeneros] = useState<number[]>([]);
  const [evitados, setEvitados] = useState<number[]>([]);
  const [duracao, setDuracao] = useState<Duracao>();
  const [frequencia, setFrequencia] = useState<Frequencia>();
  const [streamings, setStreamings] = useState<number[]>([]);
  const [amados, setAmados] = useState<FilmeOpcao[]>([]);
  const [rejeitados, setRejeitados] = useState<FilmeOpcao[]>([]);

  function alternarFavorito(id: number) {
    setGeneros((atuais) => alternar(atuais, id));
    // Um gênero não pode ser favorito e evitado ao mesmo tempo.
    setEvitados((atuais) => atuais.filter((evitado) => evitado !== id));
  }

  const passoValido =
    (passo === 1 && generos.length > 0) ||
    (passo === 3 && duracao !== undefined) ||
    (passo === 4 && frequencia !== undefined) ||
    [2, 5, 6, 7].includes(passo);

  const marcadosNoPasso: Record<number, number> = {
    2: evitados.length,
    5: streamings.length,
    6: amados.length,
  };
  const rotuloAvancar = marcadosNoPasso[passo] === 0 ? "Pular" : "Próximo";

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
          aoAlternar={alternarFavorito}
        />
      )}

      {passo === 2 && (
        <ChipsGeneros
          titulo="Algum gênero que você não quer ver?"
          ajuda="Filmes desses gêneros nunca vão aparecer nas suas recomendações."
          avisoLimite="Você pode evitar até 5 gêneros."
          ocultos={generos}
          selecionados={evitados}
          aoAlternar={(id) => setEvitados((atuais) => alternar(atuais, id))}
        />
      )}

      {passo === 3 && (
        <GrupoOpcoes
          nome="duracao"
          rotulo="Duração preferida"
          opcoes={DURACOES}
          rotulos={ROTULOS_DURACAO}
          valor={duracao}
          aoMudar={setDuracao}
        />
      )}

      {passo === 4 && (
        <GrupoOpcoes
          nome="frequencia"
          rotulo="Com que frequência você assiste filmes?"
          opcoes={FREQUENCIAS}
          rotulos={ROTULOS_FREQUENCIA}
          valor={frequencia}
          aoMudar={setFrequencia}
        />
      )}

      {passo === 5 && (
        <GradeStreamings
          titulo="Quais streamings você assina?"
          selecionados={streamings}
          aoAlternar={(id) => setStreamings((atuais) => alternar(atuais, id))}
        />
      )}

      {passo === 6 && (
        <GradeFilmes
          titulo="Escolha filmes que você ama"
          subtitulo="Marque até 5. Eles guiam as primeiras recomendações."
          filtros={{ generos }}
          comBusca
          selecionados={amados}
          aoAlternar={(filme) => setAmados((atuais) => alternarFilme(atuais, filme))}
        />
      )}

      {passo === 7 && (
        <GradeFilmes
          titulo="Pela capa, quais você não assistiria?"
          subtitulo="Só pelo pôster mesmo. Isso ajuda a saber o que não te mostrar."
          filtros={{ semGeneros: [...generos, ...evitados] }}
          comTroca
          ocultos={amados.map(({ id }) => id)}
          selecionados={rejeitados}
          aoAlternar={(filme) => setRejeitados((atuais) => alternarFilme(atuais, filme))}
        />
      )}

      <Ocultos nome="generos" valores={generos} />
      <Ocultos nome="generosEvitados" valores={evitados} />
      {duracao && <input type="hidden" name="duracao" value={duracao} />}
      {frequencia && <input type="hidden" name="frequencia" value={frequencia} />}
      <Ocultos nome="streamings" valores={streamings} />
      <Ocultos nome="amados" valores={amados.map(({ id }) => id)} />
      <Ocultos nome="rejeitados" valores={rejeitados.map(({ id }) => id)} />

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
            {rotuloAvancar}
          </Button>
        ) : (
          <Button key="concluir" type="submit" size="lg" className="h-10 px-5" disabled={salvando}>
            {salvando ? "Salvando…" : "Concluir"}
          </Button>
        )}
      </div>
    </form>
  );
}
