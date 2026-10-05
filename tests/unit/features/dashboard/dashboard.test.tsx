import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CartaoFilme } from "@/features/dashboard/components/cartao-filme";
import { SecaoRecomendacoes } from "@/features/dashboard/components/secao-recomendacoes";
import { lerRodada } from "@/features/dashboard/rodada";
import type { Recomendacao } from "@/features/recomendacao/tipos";

function recomendacao(sobrescrever: Partial<Recomendacao> = {}): Recomendacao {
  return {
    id: 550,
    titulo: "Clube da Luta",
    tituloOriginal: "Fight Club",
    sinopse: "",
    posterPath: "/poster.jpg",
    backdropPath: null,
    generos: [18],
    ano: 1999,
    nota: 8.44,
    votos: 1000,
    popularidade: 50,
    motivo: "Porque você curte Drama",
    pontuacao: 0.8,
    ...sobrescrever,
  };
}

describe("lerRodada", () => {
  it("aceita inteiros de 0 a 9999", () => {
    expect(lerRodada("3")).toBe(3);
    expect(lerRodada("0")).toBe(0);
    expect(lerRodada("9999")).toBe(9999);
  });

  it.each([undefined, "", "-1", "1.5", "abc", "10000", ["2", "3"]])("%j vira 0", (valor) => {
    expect(lerRodada(valor)).toBe(0);
  });
});

describe("CartaoFilme", () => {
  it("é um link para a página do filme com título, ano, nota e motivo", () => {
    render(<CartaoFilme filme={recomendacao()} />);

    const link = screen.getByRole("link", { name: "Clube da Luta (1999)" });
    expect(link).toHaveAttribute("href", "/filme/550");
    expect(screen.getByText("1999 · ★ 8.4")).toBeInTheDocument();
    expect(screen.getByText("Porque você curte Drama")).toBeInTheDocument();
  });

  it("sem ano, o nome do link é só o título", () => {
    render(<CartaoFilme filme={recomendacao({ ano: null })} />);
    expect(screen.getByRole("link", { name: "Clube da Luta" })).toBeInTheDocument();
    expect(screen.getByText("★ 8.4")).toBeInTheDocument();
  });

  it("sem pôster, mostra o bloco com o título e nenhuma imagem", () => {
    const { container } = render(<CartaoFilme filme={recomendacao({ posterPath: null })} />);
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByTestId("sem-poster")).toHaveTextContent("Clube da Luta");
  });
});

describe("SecaoRecomendacoes", () => {
  it("mostra os filmes da seção numa lista", () => {
    render(
      <SecaoRecomendacoes
        secao={{ id: "para-voce", titulo: "Escolhidos para você", filmes: [recomendacao()] }}
        urlAtual="/dashboard"
      />,
    );
    const secao = screen.getByRole("region", { name: "Escolhidos para você" });
    expect(secao).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
  });

  it("seção com erro mostra a mensagem e o link para tentar de novo, sem lista", () => {
    render(
      <SecaoRecomendacoes
        secao={{ id: "genero-99", titulo: "Documentário para você", filmes: [], erro: true }}
        urlAtual="/dashboard?rodada=2"
      />,
    );
    expect(screen.getByText("Não foi possível carregar agora.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Tentar de novo" })).toHaveAttribute(
      "href",
      "/dashboard?rodada=2",
    );
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});
