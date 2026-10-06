import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  buscarFilmesOnboarding,
  sugerirFilmesOnboarding,
} from "@/features/preferencias/filmes-onboarding";
import { TmdbErro } from "@/lib/tmdb/cliente";
import { buscarFilmes, descobrirFilmes } from "@/lib/tmdb/filmes";
import type { Pagina } from "@/lib/tmdb/tipos";

import { filme } from "../recomendacao/fabrica";

const usuario = vi.hoisted(() => ({ atual: { id: "u1" } as { id: string } | null }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: usuario.atual } }) },
  }),
}));
vi.mock("@/lib/tmdb/filmes", () => ({ descobrirFilmes: vi.fn(), buscarFilmes: vi.fn() }));

const pagina = (itens: ReturnType<typeof filme>[]): Pagina<ReturnType<typeof filme>> => ({
  itens,
  pagina: 1,
  totalPaginas: 1,
  totalResultados: itens.length,
});

beforeEach(() => {
  usuario.atual = { id: "u1" };
  vi.mocked(descobrirFilmes)
    .mockReset()
    .mockResolvedValue(
      pagina([filme(1, { posterPath: "/a.jpg", ano: 1999 }), filme(2, { posterPath: null })]),
    );
  vi.mocked(buscarFilmes)
    .mockReset()
    .mockResolvedValue(pagina([filme(3, { posterPath: "/c.jpg" })]));
});

describe("sugerirFilmesOnboarding", () => {
  it("pede ao TMDB os populares bem votados dos gêneros e devolve só os com pôster", async () => {
    const resultado = await sugerirFilmesOnboarding({ generos: [28, 18] });

    expect(descobrirFilmes).toHaveBeenCalledWith({
      generos: [28, 18],
      semGeneros: undefined,
      votosMin: 1000,
      ordem: "popularidade",
      pagina: 1,
    });
    expect(resultado).toEqual({
      filmes: [{ id: 1, titulo: "Filme 1", ano: 1999, posterPath: "/a.jpg" }],
    });
  });

  it("aceita semGeneros para a grade 'pela capa'", async () => {
    await sugerirFilmesOnboarding({ semGeneros: [28, 27] });
    expect(descobrirFilmes).toHaveBeenCalledWith(
      expect.objectContaining({ generos: undefined, semGeneros: [28, 27] }),
    );
  });

  it("pede a página informada, para trocar os filmes da grade", async () => {
    await sugerirFilmesOnboarding({ semGeneros: [28], pagina: 3 });
    expect(descobrirFilmes).toHaveBeenCalledWith(expect.objectContaining({ pagina: 3 }));
  });

  it.each([0, 6, 1.5])("recusa a página %s sem chamar o TMDB", async (pagina) => {
    expect(await sugerirFilmesOnboarding({ semGeneros: [28], pagina })).toEqual({ erro: true });
    expect(descobrirFilmes).not.toHaveBeenCalled();
  });

  it("devolve erro sem lançar quando o TMDB falha", async () => {
    vi.spyOn(console, "error").mockImplementationOnce(() => {});
    vi.mocked(descobrirFilmes).mockRejectedValueOnce(new TmdbErro("TMDB respondeu 503", 503));
    expect(await sugerirFilmesOnboarding({ generos: [28] })).toEqual({ erro: true });
  });

  it("recusa sem sessão ou com filtros inválidos, sem chamar o TMDB", async () => {
    expect(await sugerirFilmesOnboarding({ generos: [1] })).toEqual({ erro: true });
    usuario.atual = null;
    expect(await sugerirFilmesOnboarding({ generos: [28] })).toEqual({ erro: true });
    expect(descobrirFilmes).not.toHaveBeenCalled();
  });
});

describe("buscarFilmesOnboarding", () => {
  it("busca pelo nome e devolve só os com pôster", async () => {
    expect(await buscarFilmesOnboarding("  matrix ")).toEqual({
      filmes: [{ id: 3, titulo: "Filme 3", ano: 2020, posterPath: "/c.jpg" }],
    });
    expect(buscarFilmes).toHaveBeenCalledWith("matrix");
  });

  it("com menos de 2 caracteres devolve lista vazia sem chamar o TMDB", async () => {
    expect(await buscarFilmesOnboarding(" m ")).toEqual({ filmes: [] });
    expect(buscarFilmes).not.toHaveBeenCalled();
  });

  it("devolve erro sem sessão ou quando o TMDB falha", async () => {
    vi.spyOn(console, "error").mockImplementationOnce(() => {});
    vi.mocked(buscarFilmes).mockRejectedValueOnce(new TmdbErro("TMDB respondeu 503", 503));
    expect(await buscarFilmesOnboarding("matrix")).toEqual({ erro: true });
    usuario.atual = null;
    expect(await buscarFilmesOnboarding("matrix")).toEqual({ erro: true });
  });
});
