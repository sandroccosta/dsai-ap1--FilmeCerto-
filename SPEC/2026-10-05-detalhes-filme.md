# Spec: Detalhes do filme

- **Data:** 2026-10-05
- **Componente:** detalhes-filme
- **Status:** aprovada para implementação
- **Substitui:** nenhuma

## O quê

A página `/filme/{id}` mostra tudo sobre um filme: cabeçalho com imagem de fundo e pôster, sinopse, direção, trailer, **onde assistir no Brasil**, elenco e filmes parecidos. É o destino dos cards do dashboard.

## Por quê

No MovieMatch antigo, os detalhes eram buscados na OMDb **pelo título**, o que trazia o filme errado quando havia homônimos, e não havia trailer nem "onde assistir". Aqui, a busca é pelo ID do TMDB, numa única chamada (`obterFilme`, da spec `cliente-tmdb`), com cache de 24 h.

"Onde assistir" é o que transforma a recomendação em ação: a pessoa descobre o filme e já sabe em qual streaming ele está.

## Decisões técnicas

| Tema | Decisão |
|---|---|
| Rota | `src/app/(app)/filme/[id]/page.tsx`, dentro da área logada (exige sessão e onboarding, como o dashboard) |
| Dados | `obterFilme(id)` do cliente do TMDB |
| ID inválido ou inexistente | `notFound()` (página 404 do app) |
| Carregamento | A página espera `obterFilme` antes de renderizar, sem `<Suspense>`: `notFound()` dentro de um trecho já transmitido não devolve 404 de verdade, e o `generateMetadata` já espera a mesma chamada. Sem `loading.tsx`, pelo motivo registrado na spec `dashboard` (o login com `?next=/filme/...` é um redirect de Server Action) |
| Falha do TMDB | `error.tsx` da rota com "Tentar de novo" (`retry`) |
| Trailer | Miniatura do YouTube; o `<iframe>` de `youtube-nocookie.com` só é criado depois do clique |
| Título da aba | `generateMetadata` com "{título} ({ano})" |

### Rota e parâmetro

- `id` precisa ser um inteiro positivo de até 10 dígitos (`/^\d{1,10}$/`, maior que 0). Qualquer outro valor → `notFound()`.
- `obterFilme` devolvendo `null` (404 do TMDB) → `notFound()`.
- `obterFilme` lançando `TmdbErro` → `error.tsx`.
- `generateMetadata` usa a mesma chamada (o cache do `fetch` evita a segunda ida ao TMDB). Se o filme não existir, o título é "Filme não encontrado".

### Layout

1. **Voltar:** link "← Voltar" para `/dashboard`.
2. **Cabeçalho**
   - Fundo: backdrop `w1280`, escurecido por um degradê para o texto ficar legível; sem backdrop, só a cor de fundo.
   - Pôster `w500` (sem pôster: bloco com o título, como no card).
   - Título (h1); título original em letra menor quando for diferente do título.
   - Linha de dados: ano · duração · nota "★ 8.4 (30.000 votos)". Itens ausentes são omitidos.
   - Gêneros como etiquetas.
   - Slogan em itálico, se houver.
   - Uma área vazia com `data-testid="acoes-filme"` reservada para os botões das specs `reacoes`, `listas` e `filmes-ocultos`.
3. **Sinopse** (h2 "Sinopse"); sem sinopse: "Sinopse não disponível em português."
4. **Direção:** "Direção: Nome1, Nome2" (omitida se vazia).
5. **Trailer** (h2 "Trailer"), só se `trailerYoutube` não for `null`:
   - antes do clique: miniatura `https://i.ytimg.com/vi/{key}/hqdefault.jpg` com um botão "Assistir trailer" (ícone ▶);
   - depois do clique: `<iframe>` 16:9 de `https://www.youtube-nocookie.com/embed/{key}?autoplay=1`, com `title="Trailer de {título}"` e `allow` para autoplay, encrypted-media e picture-in-picture.
6. **Onde assistir no Brasil** (h2):
   - Grupos "Assinatura", "Aluguel" e "Compra", cada um com os logos (`w92`, `alt` = nome do provedor) e o nome; grupos vazios são omitidos.
   - Link "Ver todas as opções" para `ondeAssistir.link` (abre em nova aba, `rel="noopener noreferrer"`).
   - Rodapé "Dados de onde assistir fornecidos por JustWatch." (exigência do TMDB).
   - Se `ondeAssistir` for `null` ou os três grupos estiverem vazios: "Não encontramos onde assistir este filme no Brasil."
7. **Elenco** (h2), se houver: lista horizontal com foto `w185` (sem foto: iniciais), nome e personagem.
8. **Filmes parecidos** (h2), se houver: o mesmo carrossel do dashboard, com o mesmo card, **sem** a linha de motivo.

### Formatação

`formatarDuracao(minutos)` em `src/features/filme/formatar.ts`:

| Entrada | Saída |
|---|---|
| `139` | "2h 19min" |
| `120` | "2h" |
| `45` | "45min" |
| `null` ou `0` | `null` (omitido) |

`formatarVotos(30000)` → "30.000" (separador pt-BR).

### Mudanças em código existente

- `CartaoFilme` (spec `dashboard`) passa a aceitar `FilmeResumo` com `motivo` opcional; sem motivo, a linha não é renderizada.
- `next.config.ts` libera imagens de `i.ytimg.com` (miniatura do trailer).
- `src/app/not-found.tsx` passa a mostrar o 404 em pt-BR ("Página não encontrada"), no lugar da página padrão do Next em inglês.

### TMDB falso

`tests/e2e/tmdb-falso/servidor.mjs` ganha `GET /3/movie/{id}` (com `append_to_response`):

- IDs de **999000000 em diante** → 404.
- Os demais → detalhes determinísticos: título "Filme {id}", sinopse, duração 125, gêneros Drama e Ação, slogan, um trailer oficial do YouTube, 3 pessoas no elenco, 1 diretor, provedores BR com Netflix em assinatura e Apple TV em aluguel, e 5 parecidos.

## Critérios de aceitação

1. **Testes unitários** (`pnpm test`) passam, cobrindo pelo menos:
   - `formatarDuracao` e `formatarVotos` com os valores da tabela;
   - o cabeçalho mostra título, título original (só quando diferente), ano, "2h 19min", "★ 8.4 (30.000 votos)", gêneros e slogan;
   - "Onde assistir": mostra os grupos com os nomes dos provedores, o link "Ver todas as opções" e o aviso da JustWatch; omite grupo vazio; com `null`, mostra "Não encontramos onde assistir este filme no Brasil.";
   - trailer: antes do clique não há `<iframe>`; depois do clique em "Assistir trailer" há um `<iframe>` com `src` de `youtube-nocookie.com/embed/{key}`;
   - elenco: nome e personagem de cada pessoa; sem foto, mostra as iniciais;
   - `CartaoFilme` sem motivo não renderiza a linha de motivo.
2. **Testes E2E** (`pnpm test:e2e`, TMDB falso) passam:
   - no dashboard, clicar no primeiro card leva a `/filme/{id}`, que mostra o título "Filme {id}" (h1), a sinopse, "Netflix" em "Onde assistir no Brasil" e a seção "Filmes parecidos" com cards;
   - "Assistir trailer" cria o player;
   - `/filme/999999999` e `/filme/abc` mostram a página 404;
   - sem sessão, `/filme/123` leva a `/login?next=%2Ffilme%2F123`;
   - os testes E2E anteriores continuam passando.
3. `pnpm lint`, `pnpm typecheck`, `pnpm build` e `pnpm check:secrets` terminam sem erros, e o CI passa na `main`.

Para o critério de sessão, o proxy passa a proteger também `/filme`.

## Fora do escopo

| Item | Onde fica |
|---|---|
| Reagir ao filme ("Não é pra mim", "Gostei", "Amei") | spec `reacoes` (usa a área `acoes-filme`) |
| "Quero assistir" / "Já assisti" | spec `listas` (usa a área `acoes-filme`) |
| "Não me interessa" | spec `filmes-ocultos` (usa a área `acoes-filme`) |
| Página pública do filme, para compartilhar sem login | **descartado por ora**: os botões de ação exigiriam um estado "entre para avaliar" |
| Página de pessoas (ator, diretor) | **não planejado** |
| Avaliações e críticas de outros usuários | **não planejado** |
