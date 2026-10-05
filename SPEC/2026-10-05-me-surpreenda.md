# Spec: Me surpreenda

- **Data:** 2026-10-05
- **Componente:** me-surpreenda
- **Status:** aprovada para implementação
- **Substitui:** a spec planejada `extras` (só o "me surpreenda" foi mantido; ver "Fora do escopo")

## O quê

No centro do dashboard, um **globo de pôsteres** gira devagar. Ao clicar em **"Me surpreenda"**, ele acelera, gira por alguns segundos e para com um filme sorteado de frente; em seguida abre um **pop-up** com esse filme e as opções "Ver detalhes", "Sortear outro" e fechar.

O globo mistura dois tipos de filme:

- **do seu gosto**: dos gêneros e da duração preferidos, mas de páginas do TMDB que os carrosséis não usam;
- **fora da sua bolha**: de gêneros que a pessoa **não** escolheu, com um piso de qualidade.

## Por quê

Os carrosséis respondem "o que combina comigo?". O "me surpreenda" responde "não sei o que ver hoje, me dá uma ideia", com um momento lúdico que funciona bem numa demonstração ao vivo. Incluir filmes fora dos gêneros favoritos evita a "bolha" que só reforça o mesmo gosto e pode revelar algo que a pessoa não buscaria sozinha.

## Decisões técnicas

| Tema | Decisão |
|---|---|
| Lugar | Bloco "Me surpreenda" no dashboard, entre o topo e os carrosséis, no seu próprio `<Suspense>` |
| Dados | `montarGlobo()` (server-only) faz 2 chamadas a `descobrirFilmes`, em paralelo, com cache de 6 h |
| Aleatoriedade | `Math.random` (a cada carregamento e a cada clique), diferente das seções, que mudam uma vez por dia |
| Sorteio | Entre os filmes do próprio globo, no navegador: a animação sempre para no filme do pop-up, sem esperar rede |
| Animação | CSS 3D (`perspective`, `rotateY`, `translateZ`); `transition` com desaceleração no giro |
| Movimento reduzido | Com `prefers-reduced-motion: reduce`, o globo não gira (nem parado nem no sorteio) e o pop-up abre direto |
| Pop-up | `<dialog>` nativo com `showModal()`: foco preso, fecha com Esc, rótulo pelo título do filme |
| Falha | Se as duas consultas falharem, ou sobrarem menos de 3 filmes, o bloco não aparece; o resto do dashboard segue normal |

### Montagem do globo (`src/features/surpresa/montar.ts`)

Entrada: preferências, `excluir` (reações e listas, como no dashboard), `api` (para testes) e `aleatorio` (padrão `Math.random`, injetável nos testes).

1. **Do seu gosto:** `descobrirFilmes` com `generos` = favoritos, filtros de duração (`filtrosDeDuracao`), `votosMin` e `notaMin` do perfil da frequência (`PERFIS`), ordem `popularidade` e página sorteada entre `paginaMax + 1` e `paginaMax + 5` (fora da faixa que o motor usa).
2. **Fora da sua bolha:** sorteia 3 gêneros entre os que **não** estão nos favoritos; `descobrirFilmes` com esses `generos` (qualquer um deles), `semGeneros` = favoritos, `notaMin: 6.5`, `votosMin: 500`, ordem `popularidade` e página sorteada entre 1 e 5. Sem duração (a surpresa não precisa seguir esse filtro).
3. De cada resultado, remove os filmes em `excluir`, os sem pôster e os repetidos, e sorteia até **6**.
4. Junta os dois grupos (até 12) e embaralha.
5. Motivo de cada filme:
   - do seu gosto: o mesmo de `motivoPorGeneros` ("Porque você curte Drama");
   - fora da bolha: "Fora da sua bolha: {Gênero} bem avaliado", com o primeiro gênero do filme (na ordem de `GENEROS`) que esteja entre os 3 sorteados.
6. Se uma das consultas falhar, usa só a outra. Se sobrarem menos de 3 filmes, devolve lista vazia (o bloco não aparece).

Saída: `FilmeGlobo[]`, com `id`, `titulo`, `ano`, `nota`, `sinopse`, `posterPath`, `motivo` e `origem` (`"gosto"` ou `"bolha"`).

### Globo (`src/features/surpresa/components/globo-surpresa.tsx`, Client Component)

- `<section aria-labelledby>` com o título (h2) "Não sabe o que ver?" e o texto "Gire o globo e deixe o Filme Certo escolher."
- Os pôsteres (`w185`) ficam em círculo: o item `i` de `n` recebe `rotateY(i × 360/n)` e `translateZ(raio)`. O anel gira devagar em repouso (uma volta a cada ~40 s).
- Os pôsteres do globo são decorativos (`aria-hidden="true"`); a interação acessível é o botão e o pop-up.
- **Botão "Me surpreenda"** (ícone `Shuffle`):
  1. sorteia o índice `k`;
  2. gira o anel até o ângulo que deixa o item `k` de frente, somando 3 voltas completas, com `transition` de ~2,6 s e curva de desaceleração;
  3. ao fim da transição (`transitionend`, com um tempo-limite de segurança), abre o pop-up;
  4. durante o giro, o botão fica desabilitado e mostra "Sorteando…".
- **Pop-up** (`<dialog>`, `aria-labelledby` no título):
  - pôster `w342`, título (h2), "{ano} · ★ {nota}", sinopse (até 4 linhas) e o motivo;
  - **"Ver detalhes"**: link para `/filme/{id}`;
  - **"Sortear outro"**: fecha o pop-up e gira de novo;
  - **"Fechar"** (botão com ícone ✕ e `aria-label`) e a tecla Esc fecham.

### Dashboard

`src/app/(app)/dashboard/page.tsx` ganha o bloco, num `<Suspense>` próprio (fallback: um círculo em esqueleto), antes das seções. O `excluir` usado é o mesmo das seções (reações e listas).

### TMDB falso

Nada novo: o `discover` do servidor falso já responde por gênero e página (filmes sem pôster). Para o globo ter pôsteres nos testes E2E, o servidor falso passa a devolver `poster_path` `"/falso-{id}.jpg"` para filmes cujo ID termine em número par; os de ID ímpar continuam sem pôster, exercitando o filtro. As imagens quebram nos testes (não há CDN), o que não afeta os testes.

## Critérios de aceitação

1. **Testes unitários** (`pnpm test`) passam, cobrindo pelo menos:
   - `montarGlobo` com um TMDB falso e `aleatorio` fixo:
     - faz 1 consulta "do seu gosto" com os gêneros favoritos, os filtros de duração e do perfil e página entre `paginaMax + 1` e `paginaMax + 5`;
     - faz 1 consulta "fora da bolha" com 3 gêneros que não são favoritos, `semGeneros` = favoritos, `notaMin` 6.5 e `votosMin` 500;
     - devolve no máximo 6 de cada origem, sem filmes de `excluir`, sem filmes sem pôster e sem repetidos;
     - o motivo "fora da bolha" é "Fora da sua bolha: {Gênero} bem avaliado";
     - se a consulta "fora da bolha" falha, devolve só os "do seu gosto"; com menos de 3 filmes no total, devolve lista vazia;
   - o globo, com movimento reduzido simulado: clicar em "Me surpreenda" abre o pop-up com o título, o motivo e o link "Ver detalhes" para `/filme/{id}`; "Sortear outro" abre o pop-up de novo; "Fechar" fecha;
   - o ângulo de parada deixa o item sorteado de frente (função pura `anguloPara(indice, total, voltas)`).
2. **Testes E2E** (`pnpm test:e2e`, TMDB falso) passam:
   - depois do onboarding, o dashboard mostra a seção "Não sabe o que ver?" e o botão "Me surpreenda";
   - com movimento reduzido (`reducedMotion: "reduce"`), clicar em "Me surpreenda" abre um diálogo com um título e o link "Ver detalhes"; clicar nele leva a `/filme/{id}`;
   - sem movimento reduzido, o diálogo abre em até 5 s depois do clique;
   - Esc fecha o diálogo;
   - os testes E2E anteriores continuam passando.
3. `pnpm lint`, `pnpm typecheck`, `pnpm build` e `pnpm check:secrets` terminam sem erros, e o CI passa na `main`.

## Fora do escopo

| Item | Situação |
|---|---|
| Estatísticas pessoais (spec `extras`) | **não será feito** nesta entrega |
| Tema claro com alternância (spec `extras`) | **não será feito** nesta entrega |
| Sortear com filtro ("só comédia") | **não planejado** |
| Som, confete ou vibração | **não planejado** |
| Guardar o histórico de sorteios | **não planejado** |
