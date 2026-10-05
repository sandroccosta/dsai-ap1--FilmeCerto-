import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Paginacao } from "@/features/busca/components/paginacao";
import { ResultadosBusca } from "@/features/busca/components/resultados-busca";
import { filtrosParaDescoberta, lerBusca, parametrosDaBusca } from "@/features/busca/parametros";
import type { FilmeResumo, Pagina } from "@/lib/tmdb/tipos";

function filme(id: number): FilmeResumo {
  return {
    id,
    titulo: `Matrix ${id}`,
    tituloOriginal: `Matrix ${id}`,
    sinopse: "",
    posterPath: null,
    backdropPath: null,
    generos: [878],
    ano: 1999,
    nota: 8.2,
    votos: 100,
    popularidade: 10,
  };
}

const pagina = (
  itens: FilmeResumo[],
  totalResultados: number,
  totalPaginas = 1,
): Pagina<FilmeResumo> => ({ itens, pagina: 1, totalPaginas, totalResultados });

const hoje = new Date("2026-10-05T12:00:00Z");

describe("lerBusca", () => {
  it("normaliza o texto", () => {
    expect(lerBusca({ q: "  clube   da luta " }).texto).toBe("clube da luta");
    expect(lerBusca({ q: "a".repeat(150) }).texto).toHaveLength(100);
    expect(lerBusca({}).texto).toBe("");
    expect(lerBusca({ q: ["a", "b"] }).texto).toBe("");
  });

  it("lê a página entre 1 e 500", () => {
    expect(lerBusca({ pagina: "2" }).pagina).toBe(2);
    for (const valor of ["0", "-1", "abc", "501", undefined]) {
      expect(lerBusca({ pagina: valor }).pagina).toBe(1);
    }
  });

  it("só entra no modo filtros com modo=filtros", () => {
    expect(lerBusca({ modo: "filtros" }).modo).toBe("filtros");
    expect(lerBusca({ modo: "outro" }).modo).toBe("nome");
    expect(lerBusca({}).modo).toBe("nome");
  });

  it("valida os filtros e aplica os padrões", () => {
    expect(lerBusca({ genero: "18", ano: "2010" }, hoje).filtros).toEqual({
      genero: 18,
      ano: 2010,
      duracao: "indiferente",
      ordem: "popularidade",
    });
    expect(
      lerBusca({ genero: "1", ano: "1500", duracao: "enorme", ordem: "x" }, hoje).filtros,
    ).toEqual({ genero: null, ano: null, duracao: "indiferente", ordem: "popularidade" });
    expect(lerBusca({ ano: "abc" }, hoje).filtros.ano).toBeNull();
    expect(lerBusca({ ano: "2029" }, hoje).filtros.ano).toBeNull();
  });
});

describe("filtrosParaDescoberta", () => {
  it("traduz Drama + 2010 + média + nota para o discover", () => {
    expect(
      filtrosParaDescoberta({ genero: 18, ano: 2010, duracao: "media", ordem: "nota" }, 2),
    ).toEqual({
      generos: [18],
      ano: 2010,
      duracaoMin: 90,
      duracaoMax: 120,
      ordem: "nota",
      votosMin: 200,
      pagina: 2,
    });
  });

  it("sem filtros, lista os populares", () => {
    expect(
      filtrosParaDescoberta(
        { genero: null, ano: null, duracao: "indiferente", ordem: "popularidade" },
        1,
      ),
    ).toEqual({ ordem: "popularidade", pagina: 1 });
  });
});

describe("parametrosDaBusca", () => {
  it("mantém só o necessário para a paginação", () => {
    expect(parametrosDaBusca(lerBusca({ q: "matrix", pagina: "2" }))).toEqual({ q: "matrix" });
    expect(
      parametrosDaBusca(lerBusca({ modo: "filtros", genero: "27", duracao: "curta" }, hoje)),
    ).toEqual({ modo: "filtros", genero: "27", duracao: "curta" });
  });
});

describe("ResultadosBusca", () => {
  const base = { parametros: { q: "matrix" } };

  it("pede um texto quando a busca por nome tem menos de 2 caracteres", () => {
    render(<ResultadosBusca {...base} modo="nome" texto="a" resultado={null} />);
    expect(screen.getByText("Digite o nome de um filme para começar.")).toBeInTheDocument();
  });

  it("mostra a contagem e os cards", () => {
    render(
      <ResultadosBusca
        {...base}
        modo="nome"
        texto="matrix"
        resultado={pagina([filme(1), filme(2)], 1234)}
      />,
    );
    expect(screen.getByText("1.234 resultados para “matrix”")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByRole("link", { name: "Matrix 1 (1999)" })).toHaveAttribute(
      "href",
      "/filme/1",
    );
  });

  it("usa o singular com 1 resultado", () => {
    render(
      <ResultadosBusca {...base} modo="nome" texto="matrix" resultado={pagina([filme(1)], 1)} />,
    );
    expect(screen.getByText("1 resultado para “matrix”")).toBeInTheDocument();
  });

  it("avisa quando não há resultados", () => {
    render(<ResultadosBusca {...base} modo="nome" texto="nada" resultado={pagina([], 0, 0)} />);
    expect(screen.getByText("Nenhum filme encontrado para “nada”.")).toBeInTheDocument();
  });

  it("no modo filtros, conta os filmes e avisa quando não há nenhum", () => {
    const { rerender } = render(
      <ResultadosBusca {...base} modo="filtros" texto="" resultado={pagina([filme(1)], 1)} />,
    );
    expect(screen.getByText("1 filme encontrado")).toBeInTheDocument();
    rerender(
      <ResultadosBusca {...base} modo="filtros" texto="" resultado={pagina([filme(1)], 40)} />,
    );
    expect(screen.getByText("40 filmes encontrados")).toBeInTheDocument();
    rerender(<ResultadosBusca {...base} modo="filtros" texto="" resultado={pagina([], 0, 0)} />);
    expect(screen.getByText("Nenhum filme encontrado com esses filtros.")).toBeInTheDocument();
  });
});

describe("Paginacao", () => {
  it("no meio, tem Anterior e Próxima mantendo os parâmetros", () => {
    render(<Paginacao parametros={{ q: "matrix" }} pagina={2} totalPaginas={3} />);
    expect(screen.getByText("Página 2 de 3")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Anterior" })).toHaveAttribute(
      "href",
      "/busca?q=matrix&pagina=1",
    );
    expect(screen.getByRole("link", { name: "Próxima" })).toHaveAttribute(
      "href",
      "/busca?q=matrix&pagina=3",
    );
  });

  it("mantém os filtros", () => {
    render(
      <Paginacao parametros={{ modo: "filtros", genero: "27" }} pagina={1} totalPaginas={3} />,
    );
    expect(screen.getByRole("link", { name: "Próxima" })).toHaveAttribute(
      "href",
      "/busca?modo=filtros&genero=27&pagina=2",
    );
  });

  it("na primeira página não há Anterior; na última não há Próxima", () => {
    const { rerender } = render(
      <Paginacao parametros={{ q: "matrix" }} pagina={1} totalPaginas={3} />,
    );
    expect(screen.queryByRole("link", { name: "Anterior" })).not.toBeInTheDocument();
    rerender(<Paginacao parametros={{ q: "matrix" }} pagina={3} totalPaginas={3} />);
    expect(screen.queryByRole("link", { name: "Próxima" })).not.toBeInTheDocument();
  });

  it("não aparece com uma página só", () => {
    const { container } = render(
      <Paginacao parametros={{ q: "matrix" }} pagina={1} totalPaginas={1} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
