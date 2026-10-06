import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  GloboSurpresa,
  INTERVALO_RENOVACAO_MS,
} from "@/features/surpresa/components/globo-surpresa";
import { CHAVE_MEMORIA, lerVistos, limparIds, registrarVisto } from "@/features/surpresa/memoria";
import { anguloPara } from "@/features/surpresa/angulo";
import { montarGlobo, type ApiGlobo, type FilmeGlobo } from "@/features/surpresa/montar";
import type { PreferenciasInput } from "@/features/preferencias/schema";
import { TmdbErro } from "@/lib/tmdb/cliente";

const acoesSurpresa = vi.hoisted(() => ({ novoGlobo: vi.fn() }));
vi.mock("@/features/surpresa/actions", () => acoesSurpresa);
import type { FilmeResumo, FiltrosDescoberta } from "@/lib/tmdb/tipos";

function filme(id: number, sobrescrever: Partial<FilmeResumo> = {}): FilmeResumo {
  return {
    id,
    titulo: `Filme ${id}`,
    tituloOriginal: `Filme ${id}`,
    sinopse: `Sinopse ${id}`,
    posterPath: `/p${id}.jpg`,
    backdropPath: null,
    generos: [18],
    ano: 2020,
    nota: 7.5,
    votos: 1000,
    popularidade: 10,
    ...sobrescrever,
  };
}

const preferencias: PreferenciasInput = {
  generos: [18, 28],
  duracao: "media",
  frequencia: "semanal",
};

/** TMDB falso: a consulta com semGeneros é a "fora da bolha". */
function apiFalsa(opcoes: { falharBolha?: boolean } = {}) {
  const chamadas: FiltrosDescoberta[] = [];
  const api: ApiGlobo = {
    descobrirFilmes: vi.fn(async (filtros: FiltrosDescoberta = {}) => {
      chamadas.push(filtros);
      const bolha = Boolean(filtros.semGeneros);
      if (bolha && opcoes.falharBolha) throw new TmdbErro("TMDB respondeu 503", 503);
      const base = bolha ? 9000 : 1000;
      const generoBolha = filtros.generos?.[0] ?? 37;
      return {
        pagina: 1,
        totalPaginas: 5,
        totalResultados: 100,
        itens: Array.from({ length: 10 }, (_, i) =>
          filme(base + i, {
            generos: bolha ? [generoBolha] : [18],
            posterPath: i === 9 ? null : `/p${base + i}.jpg`,
          }),
        ),
      };
    }),
  };
  return { api, chamadas };
}

describe("montarGlobo", () => {
  it("faz uma consulta do gosto e uma fora da bolha, com os filtros certos", async () => {
    const { api, chamadas } = apiFalsa();
    await montarGlobo({
      preferencias: { ...preferencias, generos: [18, 28] },
      api,
      aleatorio: () => 0,
    });

    const gosto = chamadas.find((f) => !f.semGeneros);
    const bolha = chamadas.find((f) => f.semGeneros);
    expect(gosto).toMatchObject({
      generos: [18, 28],
      duracaoMin: 90,
      duracaoMax: 120,
      votosMin: 300,
      notaMin: 6.5,
      ordem: "popularidade",
    });
    expect(gosto?.pagina).toBeGreaterThanOrEqual(6);
    expect(gosto?.pagina).toBeLessThanOrEqual(10);

    expect(bolha?.generos).toHaveLength(3);
    for (const genero of bolha?.generos ?? []) expect([18, 28]).not.toContain(genero);
    expect(bolha).toMatchObject({ semGeneros: [18, 28], notaMin: 6.5, votosMin: 500 });
  });

  it("devolve até 6 de cada origem, sem excluídos, sem pôster ausente e sem repetidos", async () => {
    const { api } = apiFalsa();
    const globo = await montarGlobo({
      preferencias: { ...preferencias, generos: [18, 28] },
      excluir: [1000, 1001, 9000],
      api,
      aleatorio: Math.random,
    });

    const ids = globo.map((f) => f.id);
    expect(globo.filter((f) => f.origem === "gosto")).toHaveLength(6);
    expect(globo.filter((f) => f.origem === "bolha")).toHaveLength(6);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of [1000, 1001, 9000, 1009, 9009]) expect(ids).not.toContain(id);
  });

  it("explica a origem no motivo", async () => {
    const { api, chamadas } = apiFalsa();
    const globo = await montarGlobo({
      preferencias: { ...preferencias, generos: [18, 28] },
      api,
      aleatorio: () => 0,
    });
    const generoBolha = chamadas.find((f) => f.semGeneros)?.generos?.[0];
    const nome = (await import("@/features/preferencias/generos")).GENEROS.find(
      (g) => g.id === generoBolha,
    )?.nome;

    expect(globo.find((f) => f.origem === "gosto")?.motivo).toBe("Porque você curte Drama");
    expect(globo.find((f) => f.origem === "bolha")?.motivo).toBe(
      `Fora da sua bolha: ${nome} bem avaliado`,
    );
  });

  it("se a bolha falha, usa só o gosto; com menos de 3 filmes, devolve vazio", async () => {
    const erro = vi.spyOn(console, "error").mockImplementation(() => {});
    const { api } = apiFalsa({ falharBolha: true });
    const globo = await montarGlobo({ preferencias: { ...preferencias }, api, aleatorio: () => 0 });
    expect(globo.length).toBe(6);
    expect(globo.every((f) => f.origem === "gosto")).toBe(true);

    const quase = await montarGlobo({
      preferencias: { ...preferencias },
      excluir: Array.from({ length: 8 }, (_, i) => 1000 + i),
      api,
      aleatorio: () => 0,
    });
    expect(quase).toEqual([]);
    erro.mockRestore();
  });
});

describe("montarGlobo com gosto de nicho", () => {
  it("se a página sorteada do gosto vem vazia, tenta a página 1 ordenada por nota", async () => {
    const chamadas: FiltrosDescoberta[] = [];
    const api: ApiGlobo = {
      descobrirFilmes: vi.fn(async (filtros: FiltrosDescoberta = {}) => {
        chamadas.push(filtros);
        const vazia = !filtros.semGeneros && (filtros.pagina ?? 1) > 1;
        return {
          pagina: filtros.pagina ?? 1,
          totalPaginas: 1,
          totalResultados: vazia ? 0 : 10,
          itens: vazia
            ? []
            : Array.from({ length: 10 }, (_, i) => filme((filtros.semGeneros ? 9000 : 1000) + i)),
        };
      }),
    };
    const globo = await montarGlobo({ preferencias, api, aleatorio: () => 0 });

    const reserva = chamadas.find((f) => !f.semGeneros && f.pagina === 1);
    expect(reserva).toMatchObject({ ordem: "nota", generos: [18, 28] });
    expect(globo.filter((f) => f.origem === "gosto")).toHaveLength(6);
  });
});

describe("anguloPara", () => {
  it.each([
    [0, 0, 12],
    [-37, 5, 12],
    [-1234.5, 11, 12],
    [0, 2, 7],
  ])("a partir de %d, deixa o item %d de %d de frente, com 3 voltas", (atual, indice, total) => {
    const alvo = anguloPara(atual, indice, total);
    const frente = (((alvo + (indice * 360) / total) % 360) + 360) % 360;
    expect(Math.min(frente, 360 - frente)).toBeCloseTo(0);
    expect(alvo).toBeLessThanOrEqual(atual - 3 * 360);
    expect(alvo).toBeGreaterThan(atual - 4 * 360 - 1e-9);
  });
});

describe("GloboSurpresa", () => {
  const filmeGlobo = (id: number): FilmeGlobo => ({
    id,
    titulo: `Filme ${id}`,
    ano: 2020,
    nota: 7.5,
    sinopse: `Sinopse ${id}`,
    posterPath: `/p${id}.jpg`,
    motivo: "Porque você curte Drama",
    origem: "gosto",
  });
  const filmes = [1, 2, 3].map(filmeGlobo);

  beforeEach(() => {
    window.localStorage.clear();
    acoesSurpresa.novoGlobo.mockReset();
    acoesSurpresa.novoGlobo.mockResolvedValue([7, 8, 9].map(filmeGlobo));
  });

  async function sortearETitulo(usuario: ReturnType<typeof userEvent.setup>, botao: string) {
    await usuario.click(screen.getByRole("button", { name: botao }));
    const dialogo = await screen.findByRole("dialog");
    return dialogo.querySelector("h2")?.textContent ?? "";
  }

  it("abre o pop-up do sorteado, com detalhes, motivo e fechar", async () => {
    const usuario = userEvent.setup();
    render(<GloboSurpresa filmes={filmes} />);

    expect(screen.getByRole("heading", { name: "Não sabe o que ver?" })).toBeInTheDocument();
    const titulo = await sortearETitulo(usuario, "Me surpreenda");
    const id = titulo.split(" ")[1];
    expect(screen.getByRole("link", { name: "Ver detalhes" })).toHaveAttribute(
      "href",
      `/filme/${id}`,
    );
    expect(screen.getByText("Porque você curte Drama")).toBeInTheDocument();

    await usuario.click(screen.getByRole("button", { name: "Fechar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("não repete filme e, quando todos saíram, sorteia de um lote novo", async () => {
    const usuario = userEvent.setup();
    render(<GloboSurpresa filmes={filmes} />);

    const titulos = [await sortearETitulo(usuario, "Me surpreenda")];
    titulos.push(await sortearETitulo(usuario, "Sortear outro"));
    titulos.push(await sortearETitulo(usuario, "Sortear outro"));
    expect(new Set(titulos)).toEqual(new Set(["Filme 1", "Filme 2", "Filme 3"]));
    expect(acoesSurpresa.novoGlobo).not.toHaveBeenCalled();

    const quarto = await sortearETitulo(usuario, "Sortear outro");
    expect(["Filme 7", "Filme 8", "Filme 9"]).toContain(quarto);
    expect(acoesSurpresa.novoGlobo).toHaveBeenCalledWith(expect.arrayContaining([1, 2, 3]));
  });

  it("lembra os sorteados no localStorage", async () => {
    const usuario = userEvent.setup();
    render(<GloboSurpresa filmes={filmes} />);
    const titulo = await sortearETitulo(usuario, "Me surpreenda");
    expect(lerVistos(window.localStorage)).toEqual([Number(titulo.split(" ")[1])]);
  });

  it("a cada 2 minutos troca os pôsteres por um lote novo", async () => {
    vi.useFakeTimers();
    try {
      render(<GloboSurpresa filmes={filmes} />);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(INTERVALO_RENOVACAO_MS + 400);
      });
      expect(acoesSurpresa.novoGlobo).toHaveBeenCalledOnce();
      const ids = [...document.querySelectorAll("[data-filme]")].map((e) =>
        e.getAttribute("data-filme"),
      );
      expect(ids.sort()).toEqual(["7", "8", "9"]);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("memória de sorteados", () => {
  const armazenamento = () => {
    const dados = new Map<string, string>();
    return {
      getItem: (k: string) => dados.get(k) ?? null,
      setItem: (k: string, v: string) => void dados.set(k, v),
    };
  };

  it("grava, lê e descarta entradas com mais de 24 h", () => {
    const a = armazenamento();
    registrarVisto(a, 10, 0);
    registrarVisto(a, 20, 23 * 3600_000);
    expect(lerVistos(a, 23 * 3600_000)).toEqual([10, 20]);
    expect(lerVistos(a, 25 * 3600_000)).toEqual([20]);
  });

  it("guarda no máximo 200 e não quebra sem localStorage ou com lixo", () => {
    const a = armazenamento();
    for (let id = 1; id <= 250; id++) registrarVisto(a, id, 1000);
    const vistos = lerVistos(a, 1000);
    expect(vistos).toHaveLength(200);
    expect(vistos[0]).toBe(51);

    expect(lerVistos(undefined)).toEqual([]);
    expect(() => registrarVisto(undefined, 1)).not.toThrow();
    a.setItem(CHAVE_MEMORIA, "isso não é json");
    expect(lerVistos(a)).toEqual([]);
  });

  it("limparIds aceita só inteiros positivos, sem repetidos, até 200", () => {
    expect(limparIds([1, 1, -2, 0, 3.5, "4", 5])).toEqual([1, 5]);
    expect(limparIds("x")).toEqual([]);
    expect(limparIds(Array.from({ length: 300 }, (_, i) => i + 1))).toHaveLength(200);
  });
});
