# Filme Certo

Recomendações de filmes feitas para o seu gosto. O Filme Certo pergunta seus gêneros favoritos, a duração que você prefere e com que frequência assiste filmes. A partir disso, monta recomendações usando o catálogo do [TMDB](https://www.themoviedb.org/) e mostra onde assistir no Brasil. O sistema aprende com as suas reações aos filmes ("Não é pra mim", "Gostei", "Amei").

Projeto da AP1 da disciplina **Desenvolvimento de Software Apoiado por IA** (UFPA, 2026). É uma reimplementação melhorada do antigo MovieMatch ([api](https://github.com/sandroccosta/moviematch-api), [web](https://github.com/sandroccosta/moviematch-web)).

## URL pública

**<https://dsai-ap1-filme-certo.vercel.app/>**

Repositório: [github.com/sandroccosta/dsai-ap1--FilmeCerto-](https://github.com/sandroccosta/dsai-ap1--FilmeCerto-)

[![CI](https://github.com/sandroccosta/dsai-ap1--FilmeCerto-/actions/workflows/ci.yml/badge.svg)](https://github.com/sandroccosta/dsai-ap1--FilmeCerto-/actions/workflows/ci.yml)

## Dupla

- Alexsandro Costa ([@sandroccosta](https://github.com/sandroccosta))
- Jonathan Fagundes

## Funcionalidades

- **Conta:** cadastro, login e logout com Supabase Auth; perfil com troca de nome e de preferências.
- **Onboarding:** wizard de 3 passos (até 5 gêneros, duração preferida e frequência).
- **Dashboard:** carrosséis "Escolhidos para você", "Porque você amou X" e um por gênero favorito, cada filme com o motivo da recomendação; botão "Gerar outras recomendações".
- **Me surpreenda:** globo 3D de pôsteres que gira e sorteia um filme, misturando o seu gosto com filmes fora da sua bolha, sem repetir.
- **Página do filme:** sinopse, elenco, direção, trailer e **onde assistir no Brasil** (assinatura, aluguel e compra).
- **Reações:** "Não é pra mim", "Gostei" e "Amei", que ajustam o motor de recomendação.
- **Listas:** "Quero assistir" e "Já assisti", com página própria.
- **Busca:** por nome ou por filtros (gênero, ano, duração e ordem).

O motor de recomendação não usa rede neural: ele monta consultas ao TMDB a partir das preferências, pontua os candidatos (afinidade de gênero, nota e popularidade) e agrega as recomendações do TMDB dos filmes que a pessoa amou. Os detalhes estão em [`SPEC/2026-10-05-motor-recomendacao.md`](SPEC/2026-10-05-motor-recomendacao.md).

## Stack

| Camada               | Tecnologia                                                       |
| -------------------- | ---------------------------------------------------------------- |
| Framework            | Next.js 16 (App Router), React 19, TypeScript (strict)           |
| Estilo               | Tailwind CSS 4 + shadcn/ui                                       |
| Banco e autenticação | Supabase (Postgres + Supabase Auth, com RLS)                     |
| Catálogo de filmes   | API do TMDB (v3, autenticação via Bearer token)                  |
| Validação            | zod                                                              |
| Testes               | Vitest + Testing Library (unidade/componentes), Playwright (E2E) |
| CI                   | GitHub Actions                                                   |
| Deploy               | Vercel                                                           |

## Como rodar

Pré-requisitos: Node.js 22.12+ (veja `.nvmrc`) e pnpm 10.

```bash
pnpm install
cp .env.example .env.local   # preencha com suas chaves do Supabase e do TMDB
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
| `pnpm db:reset`             | Recria o banco local do zero, reaplicando as migrations                        |
| `pnpm db:types`             | Gera `src/lib/supabase/database.types.ts` a partir do banco local              |

### Banco local para testes

Os testes de integração e E2E rodam contra um Supabase local, nunca contra o banco de produção. É preciso ter o Docker Desktop aberto.

```bash
pnpm db:start           # primeira vez baixa as imagens; depois leva segundos
pnpm test:integration
pnpm test:e2e
```

### Banco de produção

As migrations de `supabase/migrations/` são aplicadas no projeto Supabase da Vercel assim:

1. No painel do Supabase, em **Authentication → Sign In / Providers → Email**, desligue **Confirm email**.
2. `pnpm exec supabase login`
3. `pnpm exec supabase link --project-ref <ref-do-projeto>` (o ref está na URL do painel)
4. `pnpm exec supabase db push`

## Estrutura

```
SPEC/             specs datadas, uma por componente (escritas antes do código)
prompts/sessoes/  exports brutos das sessões com agentes de IA
src/app/          rotas (App Router)
src/components/   design system e layout
src/features/     um módulo por domínio
src/lib/          env, clientes do Supabase e do TMDB
supabase/         config e migrations do banco
tests/            unit/ e integration/ (Vitest), e2e/ (Playwright, com um TMDB falso)
```

## Specs

Uma spec por componente, cada uma commitada antes do código correspondente:

| Spec                                                                               | Componente                                  |
| ---------------------------------------------------------------------------------- | ------------------------------------------- |
| [`2026-10-02-fundacao`](SPEC/2026-10-02-fundacao.md)                               | Base do projeto, CI, layout e atribuições   |
| [`2026-10-02-auth`](SPEC/2026-10-02-auth.md)                                       | Cadastro, login, logout e proteção de rotas |
| [`2026-10-05-onboarding-preferencias`](SPEC/2026-10-05-onboarding-preferencias.md) | Wizard de preferências                      |
| [`2026-10-05-cliente-tmdb`](SPEC/2026-10-05-cliente-tmdb.md)                       | Cliente server-only da API do TMDB          |
| [`2026-10-05-motor-recomendacao`](SPEC/2026-10-05-motor-recomendacao.md)           | Motor de recomendação por seções            |
| [`2026-10-05-dashboard`](SPEC/2026-10-05-dashboard.md)                             | Carrosséis de recomendações                 |
| [`2026-10-05-detalhes-filme`](SPEC/2026-10-05-detalhes-filme.md)                   | Página do filme e onde assistir             |
| [`2026-10-05-reacoes`](SPEC/2026-10-05-reacoes.md)                                 | "Não é pra mim", "Gostei" e "Amei"          |
| [`2026-10-05-listas`](SPEC/2026-10-05-listas.md)                                   | "Quero assistir" e "Já assisti"             |
| [`2026-10-05-busca`](SPEC/2026-10-05-busca.md)                                     | Busca por nome e por filtros                |
| [`2026-10-05-perfil`](SPEC/2026-10-05-perfil.md)                                   | Edição de nome e preferências               |
| [`2026-10-05-me-surpreenda`](SPEC/2026-10-05-me-surpreenda.md)                     | Globo "Me surpreenda"                       |

## Ferramentas e modelos de IA

| Ferramenta                     | Modelo                              | Uso                                                      |
| ------------------------------ | ----------------------------------- | -------------------------------------------------------- |
| Claude Code (extensão VS Code) | Claude Opus 5.5 (`claude-opus-5-5`) | Análise do projeto antigo, design, specs e implementação |

Os registros completos das sessões estão em [`prompts/sessoes/`](prompts/sessoes/).

## Linhas de código (`cloc`)

Contagem com o comando do enunciado (só arquivos versionados; sem dependências, lockfiles, documentação e dados), em 2026-10-05:

```bash
cloc . --vcs=git \n  --exclude-dir=node_modules,vendor,dist,build,prompts \n  --exclude-lang=Markdown,JSON,YAML,CSV,Text,SVG \n  --not-match-f='(lock|.min.)'
```

**Total**

```
-------------------------------------------------------------------------------
Language                     files          blank        comment           code
-------------------------------------------------------------------------------
TypeScript                     153           1031            233           7131
JavaScript                       4             24              9            189
SQL                              4             37             13            146
TOML                             1             51            224            142
CSS                              1              5              3            131
-------------------------------------------------------------------------------
SUM:                           163           1148            482           7739
-------------------------------------------------------------------------------
```

**Código de produção** (tudo fora de `tests/`)

```
-------------------------------------------------------------------------------
Language                     files          blank        comment           code
-------------------------------------------------------------------------------
TypeScript                     105            555            209           4366
SQL                              4             37             13            146
TOML                             1             51            224            142
CSS                              1              5              3            131
JavaScript                       3             11              6             56
-------------------------------------------------------------------------------
SUM:                           114            659            455           4841
-------------------------------------------------------------------------------
```

**Testes** (`tests/`: unitários, integração e E2E)

```
-------------------------------------------------------------------------------
Language                     files          blank        comment           code
-------------------------------------------------------------------------------
TypeScript                      48            476             24           2765
JavaScript                       1             13              3            133
-------------------------------------------------------------------------------
SUM:                            49            489             27           2898
-------------------------------------------------------------------------------
```

A separação foi feita passando ao `cloc` (`--list-file`) os arquivos de `git ls-files` dentro e fora de `tests/`, com as mesmas exclusões do comando acima.

## Créditos

This product uses the TMDB API but is not endorsed or certified by TMDB. Os dados de onde assistir são fornecidos pela [JustWatch](https://www.justwatch.com/).
