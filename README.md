# Filme Certo

Recomendações de filmes feitas para o seu gosto. O Filme Certo pergunta seus gêneros favoritos, a duração que você prefere e com que frequência assiste filmes. A partir disso, monta recomendações usando o catálogo do [TMDB](https://www.themoviedb.org/) e mostra onde assistir no Brasil. O sistema aprende com as notas que você dá.

Projeto da AP1 da disciplina **Desenvolvimento de Software Apoiado por IA** (UFPA, 2026). É uma reimplementação melhorada do antigo MovieMatch ([api](https://github.com/sandroccosta/moviematch-api), [web](https://github.com/sandroccosta/moviematch-web)).

## URL pública

**<https://dsai-ap1-filme-certo.vercel.app/>**

Repositório: [github.com/sandroccosta/dsai-ap1--FilmeCerto-](https://github.com/sandroccosta/dsai-ap1--FilmeCerto-)

[![CI](https://github.com/sandroccosta/dsai-ap1--FilmeCerto-/actions/workflows/ci.yml/badge.svg)](https://github.com/sandroccosta/dsai-ap1--FilmeCerto-/actions/workflows/ci.yml)

## Dupla

- Alexsandro Costa ([@sandroccosta](https://github.com/sandroccosta))
- _A preencher_

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript (strict) |
| Estilo | Tailwind CSS 4 + shadcn/ui |
| Banco e autenticação | Supabase (Postgres + Supabase Auth, com RLS) |
| Catálogo de filmes | API do TMDB (v3, autenticação via Bearer token) |
| Validação | zod |
| Testes | Vitest + Testing Library (unidade/componentes), Playwright (E2E) |
| CI | GitHub Actions |
| Deploy | Vercel |

## Como rodar

Pré-requisitos: Node.js 22.12+ (veja `.nvmrc`) e pnpm 10.

```bash
pnpm install
cp .env.example .env.local   # preencha com suas chaves do Supabase e do TMDB
pnpm dev                     # http://localhost:3000
```

| Comando | O que faz |
|---|---|
| `pnpm dev` | Servidor de desenvolvimento |
| `pnpm build` / `pnpm start` | Build e servidor de produção |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | Checagem de tipos (`tsc --noEmit`) |
| `pnpm test` | Testes unitários e de componentes (Vitest) |
| `pnpm test:e2e` | Testes ponta a ponta (Playwright; requer `pnpm build` antes) |
| `pnpm check:secrets` | Garante que segredos não vazaram para o bundle do navegador |

## Estrutura

```
SPEC/             specs datadas, uma por componente (escritas antes do código)
prompts/sessoes/  exports brutos das sessões com agentes de IA
src/app/          rotas (App Router)
src/components/   design system e layout
src/features/     um módulo por domínio
src/lib/          env, clientes do Supabase e do TMDB
supabase/         config e migrations do banco
tests/            unit/ (Vitest) e e2e/ (Playwright)
```

## Ferramentas e modelos de IA

| Ferramenta | Modelo | Uso |
|---|---|---|
| Claude Code (extensão VS Code) | Claude Opus 5.5 (`claude-opus-5-5`) | Análise do projeto antigo, design, specs e implementação |

Os registros completos das sessões estão em [`prompts/sessoes/`](prompts/sessoes/).

## Linhas de código (`cloc`)

> _Será atualizado ao final do projeto._

## Créditos

This product uses the TMDB API but is not endorsed or certified by TMDB. Os dados de onde assistir são fornecidos pela [JustWatch](https://www.justwatch.com/).
