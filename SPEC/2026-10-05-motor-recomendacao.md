# Spec: Motor de recomendação

- **Data:** 2026-10-05
- **Componente:** motor-recomendacao
- **Status:** aprovada para implementação
- **Substitui:** nenhuma

## O quê

O motor decide **quais filmes recomendar a cada pessoa e por quê**. A partir das preferências do onboarding (e, quando existirem, das avaliações com estrelas), ele monta consultas ao TMDB, pontua os candidatos e devolve **seções** prontas para o dashboard:

1. **"Escolhidos para você"**: 20 filmes que misturam todos os gêneros favoritos.
2. **"Porque você deu 5★ para {Filme}"**: filmes parecidos com os que a pessoa mais gostou. Só aparece quando há avaliações de 4★ ou 5★ (as avaliações chegam com a spec `avaliacoes`).
3. **"{Gênero} para você"**: uma seção por gênero favorito.

Cada filme vem com um **motivo** legível ("Porque você curte Drama e Thriller").

As recomendações **mudam uma vez por dia** e também quando a pessoa pede **"Gerar outras recomendações"** (parâmetro `rodada`). Dentro do mesmo dia e da mesma rodada, o resultado é estável.

Nenhuma tela usa o motor nesta spec; o dashboard (spec `dashboard`) é quem mostra as seções e o botão.

## Por quê

No MovieMatch antigo, a "recomendação" era um catálogo fixo de uns 10 filmes por gênero no código. 6 dos 16 gêneros voltavam vazios, a duração quase nunca filtrava e a frequência era ignorada.

Aqui:

- o catálogo é o do TMDB, filtrado pelos gêneros, pela duração e por qualidade mínima;
- a frequência muda o que é recomendado: quem assiste pouco recebe os consagrados, quem assiste muito recebe filmes menos óbvios;
- cada recomendação diz por que foi feita;
- o resultado varia ao longo dos dias sem embaralhar a cada recarga, o que preserva o cache.

### Por que sem rede neural

Serviços como a Netflix usam filtragem colaborativa e redes neurais treinadas com bilhões de visualizações. O Filme Certo não tem usuários suficientes para treinar nada parecido (problema de partida fria). Em vez disso, os "parecidos" vêm de `/movie/{id}/recommendations` do TMDB, que já é calculado com dados de milhões de usuários, e o motor só **agrega e pondera** essas listas. Isso é explicável, testável e cabe no prazo. Similaridade por conteúdo, filtragem colaborativa própria e embeddings ficam registrados como alternativas descartadas (ver "Fora do escopo").

## Decisões técnicas

| Tema | Decisão |
|---|---|
| Lugar | `src/features/recomendacao/` |
| Lógica | Funções puras (planejar, ranquear, agregar, motivo), testáveis sem rede |
| Orquestração | `gerarRecomendacoes` (`server-only`) chama o cliente do TMDB em paralelo |
| Variação | Gerador pseudoaleatório determinístico com semente `(usuarioId, data em America/Sao_Paulo, rodada)` |
| Persistência | Nenhuma: nada é gravado no banco; o cache é o do `fetch` (6 h listas, 24 h por filme) |
| Falhas | Cada seção falha sozinha (`erro: true`); as outras continuam |

### Arquivos

```
src/features/recomendacao/
  perfil.ts     preferências -> filtros do TMDB e "perfil de ousadia" pela frequência
  semente.ts    hash da semente + gerador pseudoaleatório (mulberry32)
  planejar.ts   quais consultas fazer (páginas sorteadas, uma por gênero)
  ranquear.ts   pontuação, exclusões e ordenação
  parecidos.ts  agregarParecidos(): junta as recomendações do TMDB dos filmes bem avaliados
  motivo.ts     texto do motivo
  gerar.ts      gerarRecomendacoes(): orquestra tudo (server-only)
  tipos.ts      Secao, Recomendacao, EntradaMotor
```

### Entrada

```ts
type EntradaMotor = {
  preferencias: { generos: number[]; duracao: Duracao; frequencia: Frequencia };
  usuarioId: string;
  data: Date;                      // "hoje"; o dia é calculado no fuso America/Sao_Paulo
  rodada?: number;                 // padrão 0; inteiros >= 0
  avaliacoes?: {                   // padrão []
    tmdbId: number;
    titulo: string;
    nota: 1 | 2 | 3 | 4 | 5;
    generos: number[];             // gêneros do filme avaliado, para o bônus de afinidade
  }[];
  excluir?: number[];              // IDs do TMDB que nunca devem aparecer; padrão []
};
```

`avaliacoes` e `excluir` já existem na entrada para que as specs `avaliacoes`, `listas` e `filmes-ocultos` só precisem passar os dados, sem mudar o motor.

### Perfil pela duração e pela frequência

| Duração | Filtro |
|---|---|
| `curta` | `duracaoMax: 90` |
| `media` | `duracaoMin: 90`, `duracaoMax: 120` |
| `longa` | `duracaoMin: 120` |
| `indiferente` | nenhum |

| Frequência | `votosMin` | `notaMin` | Páginas sorteadas entre |
|---|---|---|---|
| `raramente` | 2000 | 7.0 | 1 e 2 |
| `mensal` | 1000 | 6.5 | 1 e 3 |
| `semanal` | 300 | 6.5 | 1 e 5 |
| `diaria` | 100 | 6.0 | 1 e 10 |

### Consultas

Para uma entrada com `n` gêneros favoritos:

1. **"Escolhidos para você":** 2 chamadas a `descobrirFilmes` com `generos` = todos os favoritos (qualquer um), filtros de duração e do perfil, ordem `popularidade`, em **2 páginas diferentes** sorteadas na faixa do perfil (se a faixa só tem 1 página possível, usa a página 1 e a página 1 ordenada por `nota`).
2. **Parecidos:** para cada uma das até **3** avaliações de nota 4 ou 5 mais altas (empate: a mais recente na ordem recebida), 1 chamada a `recomendacoesDe(tmdbId)`.
3. **Por gênero:** para cada gênero favorito, 1 chamada a `descobrirFilmes` com só aquele gênero, filtros de duração e perfil, ordem `popularidade`, em 1 página sorteada.

No máximo `2 + 3 + 5 = 10` chamadas, todas em paralelo.

### Pontuação

Para cada candidato `f`:

```
afinidade   = (gêneros de f que estão nos favoritos) / max(1, total de gêneros de f)
              + bônus de gênero vindo das avaliações (abaixo), limitado a 1
nota        = f.nota / 10
popularidade = log10(1 + f.popularidade) / log10(1 + maior popularidade entre os candidatos)
desempate   = número do gerador em [0, 0.02)

pontuacao = 0.5 * afinidade + 0.3 * nota + 0.2 * popularidade + desempate
```

**Bônus de gênero das avaliações:** cada avaliação soma ao peso dos gêneros do filme avaliado: 5★ = +0.10, 4★ = +0.05, 3★ = 0, 2★ = −0.05, 1★ = −0.10. O bônus de `f` é a média desses pesos sobre os gêneros de `f`. (Os gêneros vêm no campo `generos` de cada avaliação; até a spec `avaliacoes` existir, a lista de avaliações é vazia e o bônus é 0.)

### Parecidos (`agregarParecidos`)

Entrada: as listas de recomendações do TMDB de cada filme de origem, com a nota da origem.

- Cada candidato acumula `peso da origem × (1 − posição na lista / tamanho da lista)`, com peso 1.0 para 5★ e 0.6 para 4★. Assim, aparecer em várias listas, e no topo delas, sobe o filme.
- A seção leva o título da origem de **maior peso acumulado** do candidato mais bem colocado: "Porque você deu 5★ para {Filme}". Há uma seção por origem (até 3), cada uma com até 20 filmes, ordenados pelo peso acumulado.
- Filtros de duração **não** se aplicam aqui (os parecidos do TMDB não trazem duração); `excluir` e os próprios filmes avaliados são removidos.

### Seções e repetição

- Ordem das seções: "Escolhidos para você", depois as de parecidos, depois as de gênero na ordem da lista de gêneros (`GENEROS`).
- Um filme aparece **em uma única seção**: a primeira em que entrar. "Escolhidos para você" fica com os 20 de maior pontuação; as seguintes recebem os que sobraram.
- Seções sem nenhum filme depois das exclusões não são devolvidas (exceto quando `erro: true`).
- Filmes em `excluir` nunca aparecem.

### Motivo

| Situação | Texto |
|---|---|
| 1 gênero em comum | "Porque você curte Drama" |
| 2 gêneros | "Porque você curte Drama e Thriller" |
| 3 ou mais | "Porque você curte Drama, Thriller e Crime" (no máximo 3, na ordem de `GENEROS`) |
| Veio dos parecidos | "Parecido com {Filme}, que você deu 5★" |
| Nenhum gênero em comum | "Popular entre quem tem gostos parecidos" |

### Saída

```ts
type Recomendacao = FilmeResumo & { motivo: string; pontuacao: number };

type Secao = {
  id: string;            // "para-voce", "parecidos-{tmdbId}", "genero-{id}"
  titulo: string;        // "Escolhidos para você", "Porque você deu 5★ para Interestelar", "Drama para você"
  filmes: Recomendacao[];
  erro?: true;           // a consulta desta seção falhou; filmes vem vazio
};

function gerarRecomendacoes(entrada: EntradaMotor, api?: ApiFilmes): Promise<Secao[]>;
```

## Critérios de aceitação

1. **Testes unitários** (`pnpm test`, sem rede) passam, cobrindo pelo menos:
   - **perfil:** cada duração vira o filtro da tabela; cada frequência vira `votosMin`, `notaMin` e a faixa de páginas da tabela;
   - **semente:** a mesma `(usuarioId, data, rodada)` gera a mesma sequência; mudar a rodada ou o dia muda a sequência; `2026-10-05T02:00Z` e `2026-10-05T23:00Z` contam como dias diferentes em São Paulo (`04/10` e `05/10`);
   - **planejar:** com 3 gêneros e `semanal`, gera 2 consultas "para você" em páginas diferentes entre 1 e 5, e 1 consulta por gênero; com `raramente` as páginas ficam entre 1 e 2; com avaliações, gera 1 consulta de parecidos por avaliação de 4★ ou 5★, no máximo 3, ignorando notas 1 a 3;
   - **ranquear:** um filme de gênero favorito com nota e popularidade iguais fica à frente de um sem gênero favorito; um filme com nota maior fica à frente com afinidade igual; o bônus de uma avaliação 5★ sobe filmes do mesmo gênero; IDs em `excluir` somem;
   - **agregarParecidos:** um filme presente nas listas de duas origens fica à frente de um presente em só uma; origem 5★ pesa mais que 4★; os filmes avaliados não voltam como parecidos;
   - **seções:** a ordem é "para você", parecidos, gêneros; nenhum filme se repete entre seções; "Escolhidos para você" tem no máximo 20; seção vazia não aparece;
   - **motivo:** os textos da tabela, incluindo o limite de 3 gêneros;
   - **gerarRecomendacoes** com um TMDB falso: devolve as seções esperadas; se a consulta de um gênero lança `TmdbErro`, só aquela seção vem com `erro: true` e as outras vêm normais; mesma entrada gera exatamente a mesma saída.
2. **Teste de integração** (pulado sem token real ou no CI): com preferências Drama, `media`, `semanal`, `gerarRecomendacoes` devolve "Escolhidos para você" com pelo menos 1 filme e uma seção "Drama para você" em que todos os filmes têm o gênero 18.
3. `pnpm lint`, `pnpm typecheck`, `pnpm build` e `pnpm check:secrets` terminam sem erros, e o CI passa na `main`.

## Fora do escopo

| Item | Onde fica |
|---|---|
| Carrosséis, cards e o botão "Gerar outras recomendações" | spec `dashboard` |
| Dar estrelas a um filme e guardar as notas (com os gêneros do filme, para o bônus) | spec `avaliacoes`; o motor já aceita `avaliacoes` na entrada |
| Excluir filmes já assistidos ou na lista | spec `listas`, via `excluir` |
| Excluir filmes marcados como "não me interessa" | spec `filmes-ocultos`, via `excluir` |
| Similaridade por conteúdo (vetores de palavras-chave, elenco, direção) | **descartado por ora**: mais chamadas e calibração para ganho incerto |
| Filtragem colaborativa própria (fatoração de matriz) | **descartado**: poucos usuários para aprender algo útil |
| Embeddings / redes neurais (LLM, pgvector) | **descartado**: custo, chave de API e infraestrutura fora do prazo |
| Guardar recomendações no banco | **descartado**: o motor só consulta o TMDB com parâmetros; nada é persistido |
