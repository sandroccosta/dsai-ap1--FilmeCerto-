import { describe, expect, it } from "vitest";

import { gravarOnboarding, type BuscarFilme } from "@/features/preferencias/gravar";
import type { OnboardingInput } from "@/features/preferencias/schema";

import { criarUsuario } from "../../support/supabase-local";

const dados: OnboardingInput = {
  generos: [28, 18],
  generosEvitados: [27],
  duracao: "media",
  frequencia: "semanal",
  streamings: [8],
  amados: [603, 155],
  rejeitados: [10],
};

/** TMDB falso: o título e os gêneros vêm daqui, não do navegador. */
const buscarFilme: BuscarFilme = async (id) =>
  id === 404 ? null : { titulo: `Filme ${id}`, generos: [{ id: 878, nome: "Ficção" }] };

async function linhas(cliente: Awaited<ReturnType<typeof criarUsuario>>["cliente"]) {
  const [{ data: preferencias }, { data: reacoes }] = await Promise.all([
    cliente.from("preferencias").select("generos, generos_evitados, streamings"),
    cliente.from("reacoes").select("tmdb_id, reacao, titulo, generos").order("tmdb_id"),
  ]);
  return { preferencias, reacoes };
}

describe("gravarOnboarding", () => {
  it("grava as reações com título e gêneros do TMDB e as preferências", async () => {
    const { cliente, id } = await criarUsuario();

    expect(await gravarOnboarding(cliente, id, dados, buscarFilme)).toBe("ok");

    expect(await linhas(cliente)).toEqual({
      preferencias: [{ generos: [28, 18], generos_evitados: [27], streamings: [8] }],
      reacoes: [
        { tmdb_id: 10, reacao: "nao-gostei", titulo: "Filme 10", generos: [878] },
        { tmdb_id: 155, reacao: "amei", titulo: "Filme 155", generos: [878] },
        { tmdb_id: 603, reacao: "amei", titulo: "Filme 603", generos: [878] },
      ],
    });
  });

  it("sem filmes, grava só as preferências", async () => {
    const { cliente, id } = await criarUsuario();
    const semFilmes = { ...dados, amados: [], rejeitados: [] };

    expect(await gravarOnboarding(cliente, id, semFilmes, buscarFilme)).toBe("ok");
    expect((await linhas(cliente)).reacoes).toEqual([]);
  });

  it("se um filme não existe no TMDB, não grava nada", async () => {
    const { cliente, id } = await criarUsuario();

    expect(await gravarOnboarding(cliente, id, { ...dados, amados: [603, 404] }, buscarFilme)).toBe(
      "erro",
    );
    expect(await linhas(cliente)).toEqual({ preferencias: [], reacoes: [] });
  });

  it("se o TMDB falha, não grava nada", async () => {
    const { cliente, id } = await criarUsuario();
    const falha: BuscarFilme = async () => {
      throw new Error("TMDB fora do ar");
    };

    expect(await gravarOnboarding(cliente, id, dados, falha)).toBe("erro");
    expect(await linhas(cliente)).toEqual({ preferencias: [], reacoes: [] });
  });

  it("grava as reações antes das preferências, e repetir não duplica nada", async () => {
    const { cliente, id } = await criarUsuario();
    // Evitar um favorito passa pelo código, mas o banco recusa: só a linha de preferências falha.
    const recusadoPeloBanco = { ...dados, generosEvitados: [28] };

    expect(await gravarOnboarding(cliente, id, recusadoPeloBanco, buscarFilme)).toBe("erro");
    const depoisDaFalha = await linhas(cliente);
    expect(depoisDaFalha.preferencias).toEqual([]);
    expect(depoisDaFalha.reacoes).toHaveLength(3);

    expect(await gravarOnboarding(cliente, id, dados, buscarFilme)).toBe("ok");
    const depois = await linhas(cliente);
    expect(depois.preferencias).toHaveLength(1);
    expect(depois.reacoes).toHaveLength(3);
  });
});
