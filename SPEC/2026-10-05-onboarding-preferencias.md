# Spec: Onboarding de preferências

- **Data:** 2026-10-05
- **Componente:** onboarding-preferencias
- **Status:** aprovada para implementação
- **Substitui:** nenhuma (ajusta um critério de `SPEC/2026-10-02-auth.md`; ver "Impacto em outras specs")

## O quê

Logo depois do cadastro, o **Filme Certo** pergunta à pessoa do que ela gosta, num wizard de 3 passos:

1. **Gêneros favoritos:** de 1 a 5, entre os 19 gêneros de filme do TMDB.
2. **Duração preferida:** curta, média, longa ou tanto faz.
3. **Frequência:** com que frequência a pessoa assiste filmes.

As respostas ficam na tabela `preferencias`. Enquanto a pessoa não conclui o onboarding, a área logada a manda de volta para ele. O dashboard provisório passa a mostrar um resumo das preferências.

## Por quê

As preferências são a entrada do motor de recomendação: sem elas não há o que recomendar.

O MovieMatch antigo também perguntava isso, mas tinha falhas:

- 6 dos 16 gêneros oferecidos sempre voltavam vazios, por causa de um mapa de tradução feito à mão;
- o filtro de duração quase nunca era aplicado;
- a frequência era salva e nunca usada;
- o formulário aceitava campos vazios.

Aqui os gêneros usam os IDs do próprio TMDB, as opções têm significado definido (usado pelo `motor-recomendacao`) e a validação acontece no cliente, no servidor e no banco.

## Decisões técnicas

| Tema | Decisão |
|---|---|
| Lista de gêneros | Constante no código com os 19 gêneros de filme do TMDB (ID e nome em pt-BR). Um teste de integração confere a constante contra a API quando há token real. |
| Formato | Wizard de 3 passos num Client Component; salva tudo de uma vez no fim |
| Gravação | Server Action `salvarPreferencias`, validada com o mesmo schema zod do cliente, com `upsert` |
| "Onboarding concluído" | Existir uma linha em `preferencias` para o usuário. Não há coluna separada. |
| Proteção | Layout de `(app)` exige preferências; layout de `/onboarding` exige não tê-las; o proxy exige sessão nas duas |

### Gêneros

`src/features/preferencias/generos.ts` exporta a lista, nesta ordem de exibição (alfabética):

| ID | Nome |
|---|---|
| 28 | Ação |
| 16 | Animação |
| 12 | Aventura |
| 10770 | Cinema TV |
| 35 | Comédia |
| 80 | Crime |
| 99 | Documentário |
| 18 | Drama |
| 10751 | Família |
| 14 | Fantasia |
| 37 | Faroeste |
| 878 | Ficção científica |
| 10752 | Guerra |
| 36 | História |
| 9648 | Mistério |
| 10402 | Música |
| 10749 | Romance |
| 27 | Terror |
| 53 | Thriller |

Se o teste contra o TMDB apontar nome diferente para algum ID, vale o nome do TMDB e a tabela acima é corrigida.

### Opções

| Campo | Valor no banco | Texto na tela | Significado para o motor |
|---|---|---|---|
| duração | `curta` | Curtos (até 90 min) | `runtime ≤ 90` |
| duração | `media` | Médios (90 a 120 min) | `90 ≤ runtime ≤ 120` |
| duração | `longa` | Longos (mais de 120 min) | `runtime ≥ 120` |
| duração | `indiferente` | Tanto faz | sem filtro |
| frequência | `raramente` | Raramente (menos de um por mês) | — |
| frequência | `mensal` | Algumas vezes por mês | — |
| frequência | `semanal` | Toda semana | — |
| frequência | `diaria` | Quase todo dia | — |

Como a frequência afeta as recomendações fica para a spec `motor-recomendacao`.

### Wizard

- Rota `/onboarding`, com título "Conte do que você gosta" e indicação "Passo N de 3" mais uma barra de progresso.
- **Passo 1:** os 19 gêneros como botões de alternância (`aria-pressed`). Quando 5 estão escolhidos, os outros ficam desabilitados e aparece "Você pode escolher até 5 gêneros.".
- **Passos 2 e 3:** grupo de opções de escolha única (`radiogroup`), com as opções da tabela acima.
- **Navegação:** **Voltar** (escondido no passo 1) e **Próximo**, que fica desabilitado enquanto o passo não está válido. No passo 3, o botão vira **Concluir**.
- Voltar mantém as escolhas já feitas.
- Ao concluir, o formulário envia `generos` (vários valores), `duracao` e `frequencia` para `salvarPreferencias`. O botão mostra "Salvando…" durante o envio.
- Se o servidor recusar, a mensagem aparece num `role="alert"` e as escolhas continuam na tela.

Schema em `src/features/preferencias/schema.ts`:

| Campo | Regra | Mensagem |
|---|---|---|
| `generos` | de 1 a 5 IDs, todos da lista, sem repetição | "Escolha de 1 a 5 gêneros." |
| `duracao` | um dos 4 valores | "Escolha uma duração." |
| `frequencia` | um dos 4 valores | "Escolha uma frequência." |

### Redirecionamentos

| Situação | Resultado |
|---|---|
| Cadastro concluído | vai para `/onboarding` |
| Sem sessão, abre `/onboarding` | `/login?next=%2Fonboarding` (proxy) |
| Com sessão e sem preferências, abre rota de `(app)` (ex.: `/dashboard`) | `/onboarding` |
| Com sessão e com preferências, abre `/onboarding` | `/dashboard` |
| Onboarding concluído | `/dashboard` |

O login continua levando para `next` ou `/dashboard`; quem ainda não tem preferências cai no `/onboarding` pelo layout de `(app)`.

### Dashboard provisório

Abaixo de "Olá, {nome}", mostra o resumo das preferências no formato:

> Ação, Drama · Médios (90 a 120 min) · Toda semana

com os gêneros na ordem da lista.

### Banco de dados

Migration `supabase/migrations/<timestamp>_preferencias.sql`:

- **Enums** `public.duracao_preferida` (`curta`, `media`, `longa`, `indiferente`) e `public.frequencia_assistir` (`raramente`, `mensal`, `semanal`, `diaria`).
- **Tabela `public.preferencias`**
  - `usuario_id uuid primary key references auth.users(id) on delete cascade`
  - `generos int[] not null`, com `check` de 1 a 5 elementos e todos contidos na lista dos 19 IDs
  - `duracao public.duracao_preferida not null`
  - `frequencia public.frequencia_assistir not null`
  - `criado_em` e `atualizado_em timestamptz not null default now()`, com o trigger `public.tocar_atualizado_em()` (já existente) no update
- **RLS ligada**, para `authenticated`, sempre com `usuario_id = (select auth.uid())`:
  - `select` (`using`);
  - `insert` (`with check`);
  - `update` (`using` e `with check`).
  - Sem política de `delete`.

Os tipos em `src/lib/supabase/database.types.ts` são regenerados com `pnpm db:types`.

`obterUsuarioAtual` não muda. Uma nova função `obterPreferencias()` (server-only, memoizada por renderização) devolve as preferências do usuário logado ou `null`.

### Teste contra o TMDB

`tests/integration/preferencias/generos-tmdb.test.ts` chama `GET https://api.themoviedb.org/3/genre/movie/list?language=pt-BR` com o `TMDB_READ_TOKEN` e confere que os IDs e nomes são exatamente os da constante (sem considerar a ordem). O teste é **pulado** quando o token não está definido ou quando roda no CI (variável `CI`), onde o token é falso.

## Impacto em outras specs

Em `SPEC/2026-10-02-auth.md`, o critério "cadastro com dados válidos leva a `/dashboard`, que mostra 'Olá, {nome}'" passa a ser "cadastro com dados válidos leva a `/onboarding`". A spec de auth é ajustada no mesmo commit desta spec.

## Critérios de aceitação

1. `pnpm db:reset` aplica as duas migrations do zero sem erros.
2. **Testes unitários** (`pnpm test`) passam, cobrindo pelo menos:
   - a constante tem 19 gêneros, com IDs únicos, em ordem alfabética de nome;
   - o schema aceita 1 e 5 gêneros e rejeita, com a mensagem da tabela, 0 gêneros, 6 gêneros, ID fora da lista, gênero repetido, duração inválida e frequência inválida;
   - no wizard, **Próximo** fica desabilitado sem gênero escolhido e habilitado com um;
   - no wizard, com 5 gêneros escolhidos, os outros ficam desabilitados e a mensagem de limite aparece;
   - no wizard, **Voltar** do passo 2 para o 1 mantém os gêneros marcados (`aria-pressed="true"`);
   - a função que monta o resumo do dashboard produz "Ação, Drama · Médios (90 a 120 min) · Toda semana" para `[18, 28]`, `media`, `semanal`.
3. **Testes de integração** (`pnpm test:integration`) passam, provando que:
   - o usuário A grava (`upsert`) e lê as próprias preferências, e um segundo `upsert` atualiza a mesma linha;
   - o usuário A recebe zero linhas ao ler as preferências de B;
   - o `update` de A nas preferências de B não altera nada;
   - o usuário A não consegue inserir preferências com `usuario_id` de B;
   - o banco recusa `generos` vazio, com 6 itens e com um ID fora da lista;
   - com token real e fora do CI, a constante confere com o TMDB.
4. **Testes E2E** (`pnpm test:e2e`) passam, cobrindo:
   - cadastro leva a `/onboarding`; escolher 2 gêneros, uma duração e uma frequência e concluir leva a `/dashboard`, que mostra o resumo correspondente;
   - com sessão e sem preferências, abrir `/dashboard` leva a `/onboarding`;
   - depois de concluir, abrir `/onboarding` leva a `/dashboard`;
   - sem sessão, abrir `/onboarding` leva a `/login?next=%2Fonboarding`;
   - os testes E2E de auth (com o critério ajustado) e da fundação continuam passando.
5. `pnpm lint`, `pnpm typecheck`, `pnpm build` e `pnpm check:secrets` terminam sem erros.
6. O workflow do GitHub Actions passa na branch `main`.
7. A migration foi aplicada no Supabase de produção, e na URL da Vercel uma conta nova passa pelo onboarding e vê o resumo no dashboard.

## Fora do escopo

- Editar as preferências depois do onboarding (spec `perfil`).
- Usar as preferências para recomendar filmes (spec `motor-recomendacao`).
- Buscar a lista de gêneros no TMDB em tempo de execução (spec `cliente-tmdb`, se um dia for necessário).
- Pular o onboarding ou concluí-lo parcialmente.
- Gêneros de séries de TV.
