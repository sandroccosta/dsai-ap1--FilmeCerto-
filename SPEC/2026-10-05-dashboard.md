# Spec: Dashboard

- **Data:** 2026-10-05
- **Componente:** dashboard
- **Status:** aprovada para implementação
- **Substitui:** a página provisória de `/dashboard` criada pelas specs `auth` e `onboarding-preferencias`

## O quê

A tela principal do **Filme Certo** depois do login. Ela mostra as recomendações do motor (spec `motor-recomendacao`) como **carrosséis horizontais**, um por seção, no estilo dos serviços de streaming. Cada filme aparece como um card com pôster, título, ano, nota e o motivo da recomendação, e leva à página do filme.

A tela também tem o botão **"Gerar outras recomendações"**, que pede uma nova rodada ao motor.

## Por quê

O dashboard do MovieMatch antigo fazia cerca de 100 chamadas à OMDb a cada carregamento, quebrava quando a API falhava e mostrava gêneros vazios. Aqui:

- as recomendações vêm do motor, com cache e no máximo 10 chamadas ao TMDB;
- uma seção que falha não derruba a página;
- o carregamento mostra esqueletos em vez de tela em branco;
- cada filme diz por que foi recomendado.

É também a primeira tela que junta auth, preferências, cliente do TMDB e motor, ou seja, o centro da demonstração.

## Decisões técnicas

| Tema | Decisão |
|---|---|
| Renderização | `src/app/(app)/dashboard/page.tsx` é Server Component e chama `gerarRecomendacoes` |
| Rodada | Parâmetro de URL `?rodada=N`; o botão é um link para `N+1` (funciona sem JS; "voltar" volta à rodada anterior) |
| Carrossel | Rolagem horizontal nativa com `scroll-snap`; setas ‹ › só no desktop, num Client Component pequeno |
| Imagens | `next/image` com `urlImagem(posterPath, "w342")`; sem pôster, um bloco com o título |
| Carregamento | `loading.tsx` com esqueletos; erros inesperados em `error.tsx` |
| TMDB nos testes E2E | Servidor falso local, apontado por `TMDB_API_URL` |

### Layout

1. **Topo**
   - "Olá, {nome}" (h1).
   - O resumo das preferências que já existe ("Ação, Drama · Médios (90 a 120 min) · Toda semana").
   - Botão (link) **"Gerar outras recomendações"**, que leva a `/dashboard?rodada={rodada + 1}`.
2. **Seções**, na ordem devolvida pelo motor. Cada uma é uma `<section>` com `aria-labelledby` apontando para o título (h2) e um carrossel.
3. **Estado vazio**: se nenhuma seção tiver filmes nem erro, aparece "Não encontramos filmes com essas preferências." e um link "Tentar outras recomendações" (próxima rodada).

### Parâmetro `rodada`

`lerRodada(valor)` em `src/features/dashboard/rodada.ts`:

- inteiro de 0 a 9999 → ele mesmo;
- ausente, vazio, negativo, decimal, texto ou acima de 9999 → 0.

### Card (`CartaoFilme`)

- O card inteiro é um link para `/filme/{id}`, com nome acessível "{título} ({ano})" (ou só "{título}" sem ano).
- **Pôster** 2:3, `w342`, com `alt=""` (o nome já está no link). Sem pôster: bloco com fundo neutro e o título centralizado.
- Abaixo: título (1 linha, com reticências), "{ano} · ★ {nota com 1 casa decimal}" e o motivo em letra menor (até 2 linhas).
- Largura fixa (cerca de 160 px no celular, 180 px no desktop), para o carrossel rolar.

### Carrossel

- Lista (`<ul>`) com rolagem horizontal, `scroll-snap-type: x mandatory`, sem barra de rolagem visível e com foco por teclado nos links.
- No desktop (≥ 768 px), botões "Anterior" e "Próximo" (ícones ‹ ›, com `aria-label`) rolam cerca de uma largura visível. Os botões ficam desabilitados no início e no fim.

### Seção com erro

Quando a seção vem com `erro: true`:

- o título continua aparecendo;
- no lugar do carrossel: "Não foi possível carregar agora." e o link **"Tentar de novo"**, que recarrega a mesma URL (mesma rodada).

### Carregamento e erro geral

- `src/app/(app)/dashboard/loading.tsx`: o topo com esqueleto e 3 seções com títulos e 6 cards em esqueleto (`aria-busy="true"` e texto acessível "Carregando recomendações").
- `src/app/(app)/dashboard/error.tsx` (Client Component): "Não foi possível carregar suas recomendações." e o botão "Tentar de novo" (`reset`).

### TMDB falso para os testes E2E

`tests/e2e/tmdb-falso/servidor.mjs`, um servidor HTTP em Node puro na porta **4010**, sem dependências:

- `GET /3/discover/movie`: devolve 20 filmes determinísticos a partir de `with_genres` e `page`. O ID é `genero × 1000 + página × 20 + posição` (para vários gêneros, usa o primeiro), o título é "{Nome do gênero} {página}-{posição}", `poster_path` é `null` e `genre_ids` traz o gênero.
- **Gênero 99 (Documentário)**: quando `with_genres` é exatamente `99`, responde **503**.
- `GET /3/movie/{id}/recommendations`: devolve 10 filmes determinísticos a partir do ID.
- Qualquer outra rota: 404.
- Também exige o header `Authorization: Bearer ...` (responde 401 sem ele).

O `playwright.config.ts` passa a subir dois servidores: primeiro o TMDB falso, depois o app com `TMDB_API_URL=http://127.0.0.1:4010/3`. O CI usa o mesmo arranjo (a variável entra no `env` do workflow, para valer também no `pnpm build`).

## Critérios de aceitação

1. **Testes unitários** (`pnpm test`) passam, cobrindo pelo menos:
   - `lerRodada`: `"3"` → 3; `undefined`, `""`, `"-1"`, `"1.5"`, `"abc"` e `"10000"` → 0;
   - `CartaoFilme`: link para `/filme/{id}` com nome "{título} ({ano})"; mostra ano, "★ 7.5" e o motivo; sem pôster, mostra o bloco com o título e nenhuma `<img>`;
   - seção com `erro: true` mostra "Não foi possível carregar agora." e o link "Tentar de novo", sem lista de filmes.
2. **Testes E2E** (`pnpm test:e2e`, com o TMDB falso) passam:
   - depois do cadastro e do onboarding (Ação + Drama), `/dashboard` mostra as seções "Escolhidos para você", "Ação para você" e "Drama para você", cada uma com cards que têm motivo;
   - o primeiro card de uma seção tem `href` igual a `/filme/{id}`;
   - "Gerar outras recomendações" leva a `/dashboard?rodada=1` e o primeiro filme de "Escolhidos para você" muda;
   - com Documentário entre os gêneros, a seção "Documentário para você" mostra "Não foi possível carregar agora." e as outras seções têm cards;
   - os testes E2E de fundação, auth e onboarding continuam passando.
3. `pnpm lint`, `pnpm typecheck`, `pnpm build` e `pnpm check:secrets` terminam sem erros, e o CI passa na `main`.
4. Na URL da Vercel, com o token real do TMDB, uma conta com onboarding feito vê os carrosséis com pôsteres reais.

## Fora do escopo

| Item | Onde fica |
|---|---|
| Página do filme (`/filme/{id}`); até lá o link cai no 404 | spec `detalhes-filme` |
| Dar estrelas a filmes (faz surgir a seção "Porque você deu 5★ para X") | spec `avaliacoes` |
| Botões "quero assistir" / "já assisti" nos cards | spec `listas` |
| Botão "não me interessa" nos cards | spec `filmes-ocultos` |
| Editar preferências a partir do dashboard | spec `perfil` |
| Busca por título no header | spec `busca` |
