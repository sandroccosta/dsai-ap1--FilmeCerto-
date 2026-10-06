# Spec: Interface

- **Data:** 2026-10-06
- **Componente:** interface
- **Status:** aprovada para implementação
- **Ajusta:** `SPEC/2026-10-05-me-surpreenda.md` (o bloco "Me surpreenda" muda de lugar no dashboard)
- **Referência visual:** modelos do usuário em `Modelo interface/` (fora do repositório), usados como direção, não como cópia

## O quê

Uma identidade visual própria para o app inteiro, a partir dos modelos do usuário:

- **tokens novos** de cor e tipografia, que mudam todas as telas de uma vez;
- **landing** nova, com imagem de fundo, título forte e um "como funciona" em 3 passos;
- **cabeçalho** redesenhado, com menu do usuário;
- **acabamento** em login, cadastro, onboarding, dashboard, busca, detalhe do filme, listas, perfil, sobre e páginas de erro;
- no dashboard, o **"Me surpreenda" passa para o meio das recomendações**, depois da 2ª seção.

Nenhuma função nova: só aparência, textos e a posição do "Me surpreenda".

## Por quê

A interface atual usa o tema padrão do shadcn (cinzas neutros e a fonte Geist): funciona, mas não tem cara de app de filmes. O conceito escolhido é **a sala de cinema com as luzes apagadas**: o fundo é a sala, quente e escuro, e o âmbar é a luz da tela, usado só onde a pessoa precisa olhar (ação principal, item escolhido, progresso, foco). O tom é de projeto acadêmico, não de produto comercial: nada de "grátis", depoimentos, números de marketing ou superlativos.

No dashboard, abrir direto nas recomendações responde logo à pergunta principal ("o que eu vejo?"); o "Me surpreenda" aparece no meio da rolagem, quando a pessoa já viu as primeiras sugestões e talvez queira outra ideia.

## Decisões de design

### Cores

O app continua só no tema escuro (classe `dark` fixa no `<html>`). Os valores entram nas variáveis do shadcn em `src/app/globals.css`, então os componentes existentes mudam sem edição.

| Papel | Cor | Variáveis |
|---|---|---|
| Sala (fundo) | `#12100E` | `--background` |
| Poltrona (superfícies) | `#1C1916` | `--card`, `--popover` |
| Superfície elevada | `#25211D` | `--muted`, `--secondary`, `--accent` |
| Bordas e campos | `#2E2924` | `--border`, `--input` |
| Texto principal | `#EFE9DF` | `--foreground` e os `*-foreground` das superfícies |
| Texto secundário | `#9C9389` | `--muted-foreground` |
| Luz da tela (âmbar) | `#F5B638` | `--primary`, `--ring` |
| Texto sobre âmbar | `#12100E` | `--primary-foreground` |

Contrastes (WCAG AA): texto secundário sobre o fundo ≈ 6:1 e sobre as superfícies ≈ 5,5:1; texto escuro sobre âmbar ≈ 10:1. O vermelho de `--destructive` continua o atual.

### Tipografia

- Uma família só: **Archivo** (`next/font/google`, variável, eixos `wght` e `wdth`), no lugar de Geist e Geist Mono.
- **Títulos** (`h1`, `h2`) em Archivo condensada, no estilo dos créditos de um filme: `h1` com `font-stretch: 75%` e peso 800; `h2` com `font-stretch: 85%` e peso 700. A regra fica na camada base do CSS, então vale em todas as telas.
- **Texto corrido** em Archivo na largura normal, peso 400; linhas de no máximo ~70 caracteres nos blocos de texto.
- Sem caixa alta em rótulos e sem destacar uma palavra do título em outra cor. A exceção é a marca "Filme **Certo**" no cabeçalho, que já é assim.

### Movimento

- Só um momento animado fora do globo: a entrada da landing (imagem e texto aparecem em ~600 ms). Com `prefers-reduced-motion: reduce`, não há animação.
- Transições só em resposta à pessoa (abrir o menu, marcar um item, foco).

### Imagem da landing

- Arquivo `public/sala-escura.webp`, convertido do PNG do usuário (1672×941): uma pessoa de costas no sofá, numa sala escura, diante de uma TV com capas de filmes inventadas.
- Gerada por IA pelo usuário, com o **GPT-6** (OpenAI). O crédito vai na página Sobre.
- Servida com `next/image` (`priority`, `fill`, `object-cover`), com texto alternativo vazio (é decorativa).

## Telas

### Cabeçalho (`src/components/layout/header.tsx`)

- **Visitante:** marca à esquerda; à direita "Sobre", "Entrar" e o botão "Criar conta".
- **Logado:**
  - marca (leva a `/dashboard`), links "Início" e "Minhas listas", campo de busca (de `sm` para cima) ou ícone de busca (no celular);
  - **menu do usuário** (`Menu` do Base UI): o botão mostra um círculo com a inicial do nome e, de `sm` para cima, o nome truncado; nome acessível "Menu do usuário";
  - o menu abre com nome e email no topo e os itens "Perfil", "Sobre" e "Sair";
  - no celular, "Início" e "Minhas listas" saem da barra e entram no menu.
- O link da página atual fica marcado (`aria-current="page"` e um traço âmbar embaixo), por um pequeno componente cliente que lê o `pathname`.

### Rodapé (`src/components/layout/footer.tsx`)

O mesmo conteúdo (logo e atribuição do TMDB, "Créditos e atribuições"), mais a linha "Projeto acadêmico da UFPA, 2026", no novo estilo.

### Landing (`src/app/page.tsx`)

```
┌──────────────────────────────────────────────────────────┐
│ Filme Certo                  Sobre  Entrar  [Criar conta]│
├──────────────────────────────────────────────────────────┤
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒▒▒▒▒░░░  imagem da sala escura  ░░░░░ │
│ O FILME CERTO PARA                                       │
│ HOJE À NOITE                                             │
│ Conte o que você curte, o que prefere evitar e quais     │
│ streamings assina. O Filme Certo sugere filmes para o    │
│ seu gosto e mostra onde assistir no Brasil.              │
│ [Criar minha conta]   Sobre o projeto                    │
├──────────────────────────────────────────────────────────┤
│ Como funciona                                            │
│ 1 Conte seu gosto   2 Receba sugestões   3 Veja onde     │
│                                            assistir      │
│ Projeto acadêmico de Desenvolvimento de Software Apoiado │
│ por IA (UFPA, 2026), com dados de filmes do TMDB.        │
└──────────────────────────────────────────────────────────┘
```

- **Hero** em largura total, logo abaixo do cabeçalho, com altura de `min(100svh − cabeçalho, 44rem)`. A imagem cobre o fundo, alinhada à direita; um degradê do fundo da sala vem da esquerda (onde fica o texto) e de baixo (para emendar na próxima seção). No celular o degradê cobre a imagem toda, para o texto continuar legível.
- **Título (h1):** "O filme certo para hoje à noite", em Archivo condensada, tamanho fluido de ~2,75 rem a ~5,5 rem.
- **Texto:** "Conte o que você curte, o que prefere evitar e quais streamings assina. O Filme Certo sugere filmes para o seu gosto e mostra onde assistir no Brasil."
- **Ações:** botão "Criar minha conta" (`/cadastro`) e link "Sobre o projeto" (`/sobre`).
- **Como funciona (h2):** três passos numerados, porque são uma sequência de verdade, com o número grande em âmbar:
  1. **Conte seu gosto:** gêneros, duração, streamings e alguns filmes que você ama. Leva poucos minutos.
  2. **Receba sugestões:** seções feitas para você, que mudam conforme você avalia os filmes.
  3. **Veja onde assistir:** cada filme mostra em quais serviços está disponível no Brasil.
- Abaixo, em texto secundário: "Projeto acadêmico da disciplina Desenvolvimento de Software Apoiado por IA (UFPA, 2026), com dados de filmes do TMDB."

### Login e cadastro (`src/app/(auth)/layout.tsx` e formulários)

- A imagem da sala fica ao fundo, desfocada e escurecida (~20% de opacidade); o cartão do formulário fica no centro, como nos modelos.
- Cartão em superfície, com borda e cantos arredondados; título condensado; campos na superfície elevada com foco em âmbar; botão principal na largura toda.
- Textos e rótulos atuais ficam iguais.

### Onboarding (`src/features/preferencias/components/`)

- Cartão central (até ~42 rem) com o título "Conte do que você gosta", o texto atual e "Passo X de 7" acompanhado de uma **barra de progresso** âmbar (decorativa, `aria-hidden`; o texto continua sendo a informação acessível).
- **Gêneros:** chips arredondados; marcado = fundo âmbar com texto escuro.
- **Duração e frequência:** opções em cartões da largura toda, com o círculo do rádio à esquerda; marcada = borda âmbar e fundo levemente âmbar.
- **Streamings:** grade de 3 colunas (2 no celular) com logo e nome; marcado = borda âmbar e ícone de confirmação.
- **Filmes:** grade de pôsteres; marcado = contorno âmbar e ícone de confirmação sobre o pôster.
- Botões: "Voltar" (contorno) à esquerda; "Próximo"/"Pular"/"Concluir" (principal) à direita.

### Dashboard (`src/app/(app)/dashboard/page.tsx`)

- Topo igual em conteúdo ("Olá, {nome}", resumo das preferências, "Gerar outras recomendações"), no novo estilo.
- **Ordem nova:** as seções de recomendação vêm primeiro; o bloco "Me surpreenda" entra **depois da 2ª seção**.
  - `SecoesRecomendadas` recebe o bloco por uma prop (`meio`), já envolvido no seu próprio `<Suspense>`, e o insere depois da 2ª seção.
  - Com menos de 2 seções, o bloco vai para o fim. Sem nenhuma seção, ele aparece abaixo da mensagem "Não encontramos filmes com essas preferências."
  - Como fica dentro do `<Suspense>` das seções, o esqueleto das seções não muda; o globo carrega depois delas.
- **Bloco do globo:** ocupa uma faixa própria, com um brilho âmbar radial atrás do anel (a "luz do projetor") e uma base elíptica sob o anel, como no modelo. Textos, botão, pop-up e comportamento ficam iguais.
- Cartões de filme: pôster com cantos arredondados, título e informações no novo estilo; foco visível em âmbar.

### Busca (`src/app/(app)/busca/page.tsx`)

- De `lg` para cima, os filtros (gênero, ano, ordem) ficam numa coluna à esquerda, com o título "Filtros"; os resultados ficam à direita, com "Resultados para “{termo}”" e o total encontrado. No celular, tudo empilhado como hoje.
- As abas de modo de busca e a paginação ganham o novo estilo; o comportamento não muda.

### Detalhe do filme (`src/features/filme/components/`)

- O topo usa a imagem de fundo do filme (`backdropPath`) em largura total, escurecida com degradê; pôster, título condensado, nota com estrela, ano e duração por cima.
- Onde assistir, trailer e elenco em seções com título condensado. Sem imagem de fundo, o topo fica na cor de superfície.

### Minhas listas, perfil, sobre e erros

- **Listas:** abas com o traço âmbar na aba ativa; grade de pôsteres no padrão do dashboard.
- **Perfil:** cartão de topo com o círculo da inicial, nome e email; formulários em seções com título condensado.
- **Sobre:** mesma estrutura, no novo estilo, com o crédito novo: "Imagem da página inicial gerada por IA com o GPT-6 (OpenAI)."
- **404 e páginas de erro:** só os tokens e a tipografia novos.

## Critérios de aceitação

1. **Testes unitários** (`pnpm test`) passam, incluindo os novos:
   - `SecoesRecomendadas` coloca o bloco `meio` depois da 2ª seção; com 1 seção, depois dela; sem seções, abaixo da mensagem de vazio.
2. **Testes E2E** (`pnpm test:e2e`, TMDB falso) passam, com estes ajustes:
   - a landing mostra o h1 "O filme certo para hoje à noite"; "Criar minha conta" leva a `/cadastro` e "Sobre o projeto" leva a `/sobre`;
   - "Sair" passa a ser feito pelo menu do usuário (abrir "Menu do usuário" e escolher "Sair"), nos testes e no `helpers.ts`;
   - no dashboard, o título "Não sabe o que ver?" aparece depois do título da 2ª seção;
   - os demais testes continuam passando sem mudar o que verificam.
3. `pnpm lint`, `pnpm typecheck`, `pnpm build` e `pnpm check:secrets` terminam sem erros.
4. **Conferência manual** no navegador:
   - todas as telas listadas seguem as cores e a tipografia novas;
   - a 375 px de largura, nenhuma tela tem rolagem horizontal, e o menu do usuário dá acesso a "Início", "Minhas listas", "Perfil", "Sobre" e "Sair";
   - o foco do teclado fica visível (âmbar) em links, botões, campos, chips e cartões;
   - com movimento reduzido, a landing aparece sem animação.

## Fora do escopo

| Item | Situação |
|---|---|
| Funções que aparecem nos modelos e não existem no app ("Favoritos", "+ Nova lista", contadores nas abas, selo "Online agora") | **não será feito** |
| Tema claro e alternância de tema | **não será feito** (o app segue só no escuro) |
| Nova logo, favicon ou ícones de app | **não planejado** |
| Mudanças no motor de recomendação, no globo ou nos fluxos de dados | **não planejado** (só a posição do globo muda) |
| Ilustrações ou animações além da entrada da landing | **não planejado** |
