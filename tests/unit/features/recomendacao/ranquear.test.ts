import { describe, expect, it } from "vitest";

import { motivoParecido, motivoPorGeneros, tituloParecidos } from "@/features/recomendacao/motivo";
import { agregarParecidos } from "@/features/recomendacao/parecidos";
import { bonusPorGenero, pontuar } from "@/features/recomendacao/ranquear";
import type { ReacaoMotor } from "@/features/recomendacao/tipos";

import { filme, geradorFixo } from "./fabrica";

const contexto = (favoritos: number[], bonus = new Map<number, number>()) => ({
  favoritos,
  bonus,
  gerador: geradorFixo(0),
});

const ordemIds = (lista: { id: number }[]) => lista.map((f) => f.id);

describe("pontuar", () => {
  it("filme de gênero favorito fica à frente de um sem gênero favorito", () => {
    const resultado = pontuar(
      [filme(1, { generos: [27] }), filme(2, { generos: [18] })],
      contexto([18]),
    );
    expect(ordemIds(resultado)).toEqual([2, 1]);
  });

  it("com afinidade igual, nota maior fica à frente", () => {
    const resultado = pontuar([filme(1, { nota: 6 }), filme(2, { nota: 9 })], contexto([18]));
    expect(ordemIds(resultado)).toEqual([2, 1]);
  });

  it("aplica a fórmula 0.5 afinidade + 0.3 nota + 0.2 popularidade", () => {
    const [unico] = pontuar(
      [filme(1, { generos: [18, 27], nota: 8, popularidade: 99 })],
      contexto([18]),
    );
    // afinidade 1/2, nota 0.8, popularidade é a maior, então 1.
    expect(unico?.pontuacao).toBeCloseTo(0.5 * 0.5 + 0.3 * 0.8 + 0.2 * 1);
  });

  it("o bônus de um Amei sobe filmes do mesmo gênero", () => {
    const filmes = [filme(1, { generos: [27] }), filme(2, { generos: [35] })];
    const reacoes: ReacaoMotor[] = [{ tmdbId: 9, titulo: "X", reacao: "amei", generos: [35] }];

    expect(ordemIds(pontuar(filmes, contexto([18])))).toEqual([1, 2]);
    expect(ordemIds(pontuar(filmes, contexto([18], bonusPorGenero(reacoes))))).toEqual([2, 1]);
  });

  it("bonusPorGenero soma os pesos por estrela", () => {
    const bonus = bonusPorGenero([
      { tmdbId: 1, titulo: "A", reacao: "amei", generos: [18, 53] },
      { tmdbId: 2, titulo: "B", reacao: "nao-gostei", generos: [18] },
      { tmdbId: 3, titulo: "C", reacao: "gostei", generos: [53] },
    ]);
    expect(bonus.get(18)).toBeCloseTo(0);
    expect(bonus.get(53)).toBeCloseTo(0.15);
  });

  it("o bônus de um Não é pra mim desce filmes do mesmo gênero", () => {
    const filmes = [filme(1, { generos: [27] }), filme(2, { generos: [35] })];
    const reacoes: ReacaoMotor[] = [
      { tmdbId: 9, titulo: "X", reacao: "nao-gostei", generos: [27] },
    ];
    expect(ordemIds(pontuar(filmes, contexto([27, 35])))).toEqual([1, 2]);
    expect(ordemIds(pontuar(filmes, contexto([27, 35], bonusPorGenero(reacoes))))).toEqual([2, 1]);
  });
});

describe("agregarParecidos", () => {
  const origem = (tmdbId: number, tipo: ReacaoMotor["reacao"]): ReacaoMotor => ({
    tmdbId,
    titulo: `Origem ${tmdbId}`,
    reacao: tipo,
    generos: [18],
  });

  it("filme presente nas listas de duas origens fica à frente de um presente em só uma", () => {
    const secoes = agregarParecidos(
      [
        { origem: origem(100, "amei"), filmes: [filme(1), filme(2), filme(10)] },
        { origem: origem(200, "amei"), filmes: [filme(3), filme(2), filme(11)] },
      ],
      new Set(),
    );
    const todos = secoes.flatMap((s) => s.filmes);
    expect(todos[0]?.id).toBe(2);
  });

  it("origem Amei pesa mais que Gostei", () => {
    const secoes = agregarParecidos(
      [
        { origem: origem(100, "gostei"), filmes: [filme(1)] },
        { origem: origem(200, "amei"), filmes: [filme(2)] },
      ],
      new Set(),
    );
    expect(secoes.map((s) => s.origem.tmdbId)).toEqual([200, 100]);
    expect(secoes[0]?.filmes[0]?.peso).toBeCloseTo(1);
    expect(secoes[1]?.filmes[0]?.peso).toBeCloseTo(0.6);
  });

  it("não devolve filmes excluídos nem os próprios filmes com reação", () => {
    const secoes = agregarParecidos(
      [
        { origem: origem(100, "amei"), filmes: [filme(200), filme(7), filme(8)] },
        { origem: origem(200, "amei"), filmes: [filme(100), filme(9)] },
      ],
      new Set([8]),
    );
    expect(secoes.flatMap((s) => ordemIds(s.filmes)).sort()).toEqual([7, 9]);
  });
});

describe("motivo", () => {
  it.each([
    [[18], "Porque você curte Drama"],
    [[53, 18], "Porque você curte Drama e Thriller"],
    [[80, 53, 18, 28], "Porque você curte Ação, Crime e Drama"],
    [[99], "Popular entre quem tem gostos parecidos"],
  ])("gêneros %j viram '%s'", (generos, texto) => {
    expect(motivoPorGeneros(generos, [18, 53, 80, 28])).toBe(texto);
  });

  it("explica os parecidos e dá título à seção", () => {
    const amei: ReacaoMotor = { tmdbId: 1, titulo: "Interestelar", reacao: "amei", generos: [] };
    const gostei: ReacaoMotor = { ...amei, reacao: "gostei" };
    expect(motivoParecido(amei)).toBe("Parecido com Interestelar, que você amou");
    expect(motivoParecido(gostei)).toBe("Parecido com Interestelar, que você gostou");
    expect(tituloParecidos(amei)).toBe("Porque você amou Interestelar");
    expect(tituloParecidos(gostei)).toBe("Porque você gostou de Interestelar");
  });
});
