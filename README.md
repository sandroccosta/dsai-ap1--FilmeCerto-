# Filme Certo

**O filme certo para hoje à noite.** O Filme Certo pergunta o que você curte, o que prefere evitar e quais streamings assina. Depois sugere filmes para o seu gosto e mostra onde assistir cada um no Brasil. As sugestões mudam conforme você avalia os filmes.

### Acesse: **<https://dsai-ap1-filme-certo.vercel.app/>**

[![CI](https://github.com/sandroccosta/dsai-ap1--FilmeCerto-/actions/workflows/ci.yml/badge.svg)](https://github.com/sandroccosta/dsai-ap1--FilmeCerto-/actions/workflows/ci.yml)

Projeto da AP1 da disciplina **Desenvolvimento de Software Apoiado por IA** (UFPA, 2026), feito por:

- Alexsandro Costa ([@sandroccosta](https://github.com/sandroccosta))
- Jonathan Fagundes

## Como funciona

1. **Conte seu gosto.** No cadastro, um passo a passo de 7 perguntas: gêneros favoritos, gêneros que você não quer ver, duração preferida, com que frequência assiste, quais streamings assina, alguns filmes que você ama e, só pela capa, quais você não assistiria. Só as três primeiras são obrigatórias.
2. **Receba sugestões.** O início mostra seções feitas para você: "Nos seus streamings", "Escolhidos para você", "Porque você amou…" e uma por gênero favorito. Cada filme diz por que foi recomendado.
3. **Veja onde assistir.** A página de cada filme traz sinopse, trailer, elenco e onde ele está disponível no Brasil: assinatura, aluguel ou compra.

## O que dá para fazer

- **Me surpreenda:** um globo de pôsteres gira e sorteia um filme. Ele mistura filmes do seu gosto com bons filmes fora da sua bolha, sem repetir.
- **Avaliar filmes:** "Não é pra mim", "Gostei" e "Amei". As avaliações ajustam as próximas recomendações, e cada "Amei" gera uma seção de filmes parecidos.
- **Minhas listas:** "Quero assistir" e "Já assisti".
- **Buscar:** por nome ou por filtros (gênero, ano, duração e ordem).
- **Perfil:** trocar o nome e todas as preferências do cadastro.

### Como as recomendações são feitas

O motor não usa rede neural. Ele monta consultas ao catálogo do [TMDB](https://www.themoviedb.org/) a partir das suas preferências e corta os gêneros que você evita. Em seguida, pontua cada candidato pela afinidade com os gêneros, pela nota e pela popularidade, e junta as recomendações do TMDB para os filmes que você amou. Os detalhes estão em [`SPEC/2026-10-05-motor-recomendacao.md`](SPEC/2026-10-05-motor-recomendacao.md).

## Tecnologias

| Camada               | Tecnologia                                                       |
| -------------------- | ---------------------------------------------------------------- |
| Aplicação            | Next.js 16 (App Router), React 19, TypeScript (strict)           |
| Interface            | Tailwind CSS 4, shadcn/ui e Base UI, fonte Archivo               |
| Banco e autenticação | Supabase (Postgres + Supabase Auth, com RLS)                     |
| Catálogo de filmes   | API do TMDB (v3), com dados de onde assistir da JustWatch        |
| Validação            | zod                                                              |
| Testes               | Vitest + Testing Library (unidade/componentes), Playwright (E2E) |
| CI e deploy          | GitHub Actions e Vercel                                          |

## Como rodar localmente

Pré-requisitos: Node.js 22.12+ (veja `.nvmrc`), pnpm 10 e, para os testes de integração e E2E, Docker Desktop.

```bash
pnpm install
cp .env.example .env.local   # preencha com as chaves do Supabase e do TMDB
pnpm dev                     # http://localhost:3000
```

| Comando                     | O que faz                                                                      |
| --------------------------- | ------------------------------------------------------------------------------ |
| `pnpm dev`                  | Servidor de desenvolvimento                                                    |
| `pnpm build` / `pnpm start` | Build e servidor de produção                                                   |
| `pnpm lint`                 | ESLint                                                                         |
| `pnpm typecheck`            | Checagem de tipos (`tsc --noEmit`)                                             |
| `pnpm test`                 | Testes unitários e de componentes (Vitest)                                     |
| `pnpm test:integration`     | Testes contra o Supabase local: trigger e RLS (requer `pnpm db:start`)         |
| `pnpm test:e2e`             | Testes ponta a ponta (Playwright; faz o build apontando para o Supabase local) |
| `pnpm check:secrets`        | Garante que segredos não vazaram para o bundle do navegador                    |
| `pnpm db:start`             | Sobe o Supabase local em Docker e aplica as migrations                         |
| `pnpm db:types`             | Gera `src/lib/supabase/database.types.ts` a partir do banco local              |

Os testes de integração e E2E rodam contra o Supabase local, nunca contra o banco de produção. Nos E2E, um servidor falso faz o papel do TMDB.

## Como o projeto foi feito

Cada parte do sistema começou por uma **spec**, commitada antes do código, com o quê, por quê, critérios de aceitação e o que ficou fora do escopo. A implementação foi feita com apoio de IA, e os registros completos das sessões estão em [`prompts/sessoes/`](prompts/sessoes/).

| Ferramenta                     | Modelo                              | Uso                                                      |
| ------------------------------ | ----------------------------------- | -------------------------------------------------------- |
| Claude Code (extensão VS Code) | Claude Opus 5.5 (`claude-opus-5-5`) | Análise do projeto antigo, design, specs e implementação |
| ChatGPT                        | GPT-6                               | Imagem da página inicial                                 |

| Spec                                                                               | Componente                                           |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------- |
| [`2026-10-02-fundacao`](SPEC/2026-10-02-fundacao.md)                               | Base do projeto, CI, layout e atribuições            |
| [`2026-10-02-auth`](SPEC/2026-10-02-auth.md)                                       | Cadastro, login, logout e proteção de rotas          |
| [`2026-10-05-onboarding-preferencias`](SPEC/2026-10-05-onboarding-preferencias.md) | Primeira versão do passo a passo de preferências     |
| [`2026-10-05-cliente-tmdb`](SPEC/2026-10-05-cliente-tmdb.md)                       | Cliente server-only da API do TMDB                   |
| [`2026-10-05-motor-recomendacao`](SPEC/2026-10-05-motor-recomendacao.md)           | Motor de recomendação por seções                     |
| [`2026-10-05-dashboard`](SPEC/2026-10-05-dashboard.md)                             | Seções de recomendações                              |
| [`2026-10-05-detalhes-filme`](SPEC/2026-10-05-detalhes-filme.md)                   | Página do filme e onde assistir                      |
| [`2026-10-05-reacoes`](SPEC/2026-10-05-reacoes.md)                                 | "Não é pra mim", "Gostei" e "Amei"                   |
| [`2026-10-05-listas`](SPEC/2026-10-05-listas.md)                                   | "Quero assistir" e "Já assisti"                      |
| [`2026-10-05-busca`](SPEC/2026-10-05-busca.md)                                     | Busca por nome e por filtros                         |
| [`2026-10-05-perfil`](SPEC/2026-10-05-perfil.md)                                   | Edição de nome e preferências                        |
| [`2026-10-05-me-surpreenda`](SPEC/2026-10-05-me-surpreenda.md)                     | Globo "Me surpreenda"                                |
| [`2026-10-06-onboarding-assertivo`](SPEC/2026-10-06-onboarding-assertivo.md)       | Passo a passo de 7 perguntas e "Nos seus streamings" |
| [`2026-10-06-interface`](SPEC/2026-10-06-interface.md)                             | Identidade visual e telas                            |

### Estrutura

```
SPEC/             specs datadas, uma por componente
prompts/sessoes/  registros das sessões com IA
src/app/          rotas (App Router)
src/components/   componentes de interface e layout
src/features/     um módulo por domínio (auth, preferências, recomendação, ...)
src/lib/          env e clientes do Supabase e do TMDB
supabase/         config e migrations do banco
tests/            unit/ e integration/ (Vitest), e2e/ (Playwright)
```

## Créditos

This product uses the TMDB API but is not endorsed or certified by TMDB. Os dados de onde assistir são fornecidos pela [JustWatch](https://www.justwatch.com/). A imagem da página inicial foi gerada por IA com o GPT-6 (OpenAI).
