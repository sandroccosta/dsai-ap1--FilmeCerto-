import type { Duracao, Frequencia } from "@/features/preferencias/opcoes";
import type { Reacao } from "@/features/reacoes/opcoes";
import type { FilmeResumo } from "@/lib/tmdb/tipos";

export type ReacaoMotor = {
  tmdbId: number;
  titulo: string;
  reacao: Reacao;
  /** Gêneros do filme, para o bônus de afinidade. */
  generos: number[];
};

export type EntradaMotor = {
  preferencias: { generos: number[]; duracao: Duracao; frequencia: Frequencia };
  usuarioId: string;
  /** "Hoje"; o dia é contado no fuso America/Sao_Paulo. */
  data: Date;
  /** Cada "Gerar outras recomendações" soma 1. Padrão 0. */
  rodada?: number;
  /** Reações do usuário ("Não é pra mim", "Gostei", "Amei"). */
  reacoes?: ReacaoMotor[];
  /** IDs do TMDB que nunca devem aparecer. */
  excluir?: number[];
};

export type Recomendacao = FilmeResumo & { motivo: string; pontuacao: number };

export type Secao = {
  /** "para-voce", "parecidos-{tmdbId}" ou "genero-{id}". */
  id: string;
  titulo: string;
  filmes: Recomendacao[];
  /** A consulta desta seção falhou; `filmes` vem vazio. */
  erro?: true;
};

/** Gerador pseudoaleatório: devolve números em [0, 1). */
export type Gerador = () => number;
