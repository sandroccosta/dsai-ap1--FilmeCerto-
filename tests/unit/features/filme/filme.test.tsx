import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { CartaoFilme } from "@/features/dashboard/components/cartao-filme";
import { CabecalhoFilme } from "@/features/filme/components/cabecalho-filme";
import { Elenco } from "@/features/filme/components/elenco";
import { OndeAssistir } from "@/features/filme/components/onde-assistir";
import { Trailer } from "@/features/filme/components/trailer";
import { formatarDuracao, formatarVotos } from "@/features/filme/formatar";
import type { FilmeDetalhes } from "@/lib/tmdb/tipos";

function detalhes(sobrescrever: Partial<FilmeDetalhes> = {}): FilmeDetalhes {
  return {
    id: 550,
    titulo: "Clube da Luta",
    tituloOriginal: "Fight Club",
    sinopse: "Um homem deprimido...",
    posterPath: null,
    backdropPath: null,
    generos: [
      { id: 18, nome: "Drama" },
      { id: 53, nome: "Thriller" },
    ],
    ano: 1999,
    nota: 8.44,
    votos: 30000,
    popularidade: 70,
    duracaoMin: 139,
    slogan: "Mischief. Mayhem. Soap.",
    trailerYoutube: "abc123",
    elenco: [],
    direcao: ["David Fincher"],
    ondeAssistir: null,
    parecidos: [],
    ...sobrescrever,
  };
}

describe("formatar", () => {
  it.each([
    [139, "2h 19min"],
    [120, "2h"],
    [45, "45min"],
    [null, null],
    [0, null],
  ])("formatarDuracao(%j) = %j", (minutos, texto) => {
    expect(formatarDuracao(minutos)).toBe(texto);
  });

  it("formatarVotos usa o separador de milhar pt-BR", () => {
    expect(formatarVotos(30000)).toBe("30.000");
  });
});

describe("CabecalhoFilme", () => {
  it("mostra título, título original, ano, duração, nota, gêneros e slogan", () => {
    render(<CabecalhoFilme filme={detalhes()} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Clube da Luta");
    expect(screen.getByText("Fight Club")).toBeInTheDocument();
    expect(screen.getByText("1999")).toBeInTheDocument();
    expect(screen.getByText("2h 19min")).toBeInTheDocument();
    expect(screen.getByText("★ 8.4 (30.000 votos)")).toBeInTheDocument();
    expect(screen.getByText("Drama")).toBeInTheDocument();
    expect(screen.getByText("Thriller")).toBeInTheDocument();
    expect(screen.getByText("Mischief. Mayhem. Soap.")).toBeInTheDocument();
    expect(screen.getByTestId("acoes-filme")).toBeInTheDocument();
  });

  it("omite o título original quando é igual ao título", () => {
    render(<CabecalhoFilme filme={detalhes({ tituloOriginal: "Clube da Luta" })} />);
    expect(screen.getAllByText("Clube da Luta")).toHaveLength(2); // h1 + bloco sem pôster
  });
});

describe("OndeAssistir", () => {
  it("mostra os grupos, o link e o aviso da JustWatch, omitindo grupo vazio", () => {
    render(
      <OndeAssistir
        dados={{
          link: "https://www.themoviedb.org/movie/550/watch?locale=BR",
          assinatura: [{ id: 8, nome: "Netflix", logoPath: "/n.jpg" }],
          aluguel: [{ id: 2, nome: "Apple TV", logoPath: null }],
          compra: [],
        }}
      />,
    );
    expect(screen.getByRole("heading", { name: "Assinatura" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Aluguel" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Compra" })).not.toBeInTheDocument();
    expect(screen.getByText("Netflix")).toBeInTheDocument();
    expect(screen.getByText("Apple TV")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /Ver todas as opções/ });
    expect(link).toHaveAttribute("href", "https://www.themoviedb.org/movie/550/watch?locale=BR");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(
      screen.getByText("Dados de onde assistir fornecidos por JustWatch."),
    ).toBeInTheDocument();
  });

  it("sem dados, avisa que não encontrou", () => {
    render(<OndeAssistir dados={null} />);
    expect(
      screen.getByText("Não encontramos onde assistir este filme no Brasil."),
    ).toBeInTheDocument();
  });
});

describe("Trailer", () => {
  it("só cria o player depois do clique", async () => {
    const usuario = userEvent.setup();
    const { container } = render(<Trailer chave="abc123" titulo="Clube da Luta" />);
    expect(container.querySelector("iframe")).toBeNull();

    await usuario.click(screen.getByRole("button", { name: "Assistir trailer" }));

    const iframe = screen.getByTitle("Trailer de Clube da Luta");
    expect(iframe.getAttribute("src")).toContain("https://www.youtube-nocookie.com/embed/abc123");
  });
});

describe("Elenco", () => {
  it("mostra nome e personagem, com iniciais quando não há foto", () => {
    render(
      <Elenco
        pessoas={[
          { nome: "Brad Pitt", personagem: "Tyler Durden", fotoPath: "/b.jpg" },
          { nome: "Edward Norton", personagem: "Narrador", fotoPath: null },
        ]}
      />,
    );
    expect(screen.getByText("Brad Pitt")).toBeInTheDocument();
    expect(screen.getByText("Tyler Durden")).toBeInTheDocument();
    expect(screen.getByText("EN")).toBeInTheDocument();
  });
});

describe("CartaoFilme sem motivo", () => {
  it("não renderiza a linha de motivo", () => {
    const semMotivo = { ...detalhes(), generos: [18] };
    render(<CartaoFilme filme={semMotivo} />);
    expect(screen.queryByTestId("motivo")).not.toBeInTheDocument();
  });
});
