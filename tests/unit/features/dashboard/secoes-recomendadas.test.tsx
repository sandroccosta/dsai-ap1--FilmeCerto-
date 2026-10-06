import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SecoesRecomendadas } from "@/features/dashboard/components/secoes-recomendadas";
import type { EntradaMotor, Secao } from "@/features/recomendacao/tipos";

const gerarRecomendacoes = vi.hoisted(() => vi.fn<() => Promise<Secao[]>>());
vi.mock("@/features/recomendacao/gerar", () => ({ gerarRecomendacoes }));

function secao(numero: number): Secao {
  return { id: `secao-${numero}`, titulo: `Seção ${numero}`, filmes: [] };
}

/** Títulos das seções e do bloco do meio, na ordem do documento. */
function ordem() {
  return screen.getAllByRole("heading").map((titulo) => titulo.textContent);
}

async function renderizar() {
  const elemento = await SecoesRecomendadas({
    entrada: {} as EntradaMotor,
    urlAtual: "/dashboard",
    proximaRodada: "/dashboard?rodada=1",
    meio: <h2>Não sabe o que ver?</h2>,
  });
  render(<>{elemento}</>);
}

describe("SecoesRecomendadas com o bloco do meio", () => {
  beforeEach(() => gerarRecomendacoes.mockReset());

  it("coloca o bloco depois da 2ª seção", async () => {
    gerarRecomendacoes.mockResolvedValue([secao(1), secao(2), secao(3), secao(4)]);
    await renderizar();
    expect(ordem()).toEqual(["Seção 1", "Seção 2", "Não sabe o que ver?", "Seção 3", "Seção 4"]);
  });

  it("com uma seção só, coloca o bloco depois dela", async () => {
    gerarRecomendacoes.mockResolvedValue([secao(1)]);
    await renderizar();
    expect(ordem()).toEqual(["Seção 1", "Não sabe o que ver?"]);
  });

  it("sem seções, mostra o bloco abaixo da mensagem de vazio", async () => {
    gerarRecomendacoes.mockResolvedValue([]);
    await renderizar();
    expect(screen.getByText("Não encontramos filmes com essas preferências.")).toBeInTheDocument();
    expect(ordem()).toEqual(["Não sabe o que ver?"]);
  });
});
