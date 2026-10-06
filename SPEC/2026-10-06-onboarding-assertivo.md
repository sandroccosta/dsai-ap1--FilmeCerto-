# Spec: Onboarding assertivo

- **Data:** 2026-10-06
- **Componente:** onboarding-assertivo
- **Status:** aprovada para implementação
- **Substitui:** nenhuma (ajusta `SPEC/2026-10-05-onboarding-preferencias.md`, `SPEC/2026-10-05-motor-recomendacao.md`, `SPEC/2026-10-05-perfil.md` e `SPEC/2026-10-05-me-surpreenda.md`; ver "Impacto em outras specs")

## O quê

O wizard de onboarding passa de 3 para **7 passos**. Os 3 de hoje continuam, e entram 4 perguntas novas que dizem ao motor o que a pessoa **ama**, o que **evita** e **onde assiste**:

| # | Passo | Obrigatório? | Limite | Onde fica |
|---|---|---|---|---|
| 1 | Quais gêneros você mais curte? | sim | 1 a 5 | `preferencias.generos` (como hoje) |
| 2 | **Algum gênero que você não quer ver?** | não ("Pular") | até 5 | `preferencias.generos_evitados` (nova) |
| 3 | Duração preferida | sim | 1 | `preferencias.duracao` (como hoje) |
| 4 | Com que frequência você assiste filmes? | sim | 1 | `preferencias.frequencia` (como hoje) |
| 5 | **Quais streamings você assina?** | não ("Pular") | até 10 | `preferencias.streamings` (nova) |
| 6 | **Escolha filmes que você ama** | não ("Pular") | até 5 | reações "Amei" em `reacoes` |
| 7 | **Pela capa, quais você não assistiria?** | não ("Pular") | até 5 | reações "Não é pra mim" em `reacoes` |

O motor passa a usar essas respostas:

- os gêneros evitados nunca aparecem nas recomendações;
- uma seção nova, **"Nos seus streamings"**, abre o dashboard;
- os filmes amados viram "Porque você amou X" já no primeiro acesso.

A página `/perfil` ganha os campos de gêneros evitados e de streamings.

## Por quê

Hoje o motor só conhece os gêneros favoritos, a duração e a frequência até a pessoa começar a reagir a filmes. No primeiro acesso, então, as recomendações são genéricas: o que é popular nos gêneros escolhidos, sem saber o que ela já viu e amou, o que detesta e o que consegue assistir. Isso é o "início frio".

As perguntas novas resolvem isso logo no cadastro:

- **Filmes que ama** dão as origens das seções de parecidos, que são o sinal mais preciso do motor.
- **Filmes que não assistiria pela capa** dão um sinal negativo por gênero sem custar nada à pessoa, que só olha pôsteres.
- **Gêneros evitados** cortam de vez o que ela não quer ver. Hoje um filme de Ação e Terror pode aparecer para quem escolheu Ação e detesta Terror.
- **Streamings** puxam para o topo o que ela pode ver agora, sem pagar a mais.

Os passos novos são opcionais, para o cadastro continuar rápido para quem tem pressa.

## Decisões técnicas

| Tema | Decisão |
|---|---|
| Gêneros evitados e streamings | Colunas novas em `preferencias`. Quem já tem conta fica com listas vazias e **não** volta ao onboarding. |
| Filmes amados e "pela capa" | Linhas em `reacoes` (`amei` e `nao-gostei`), sem coluna nova. O motor e as telas de reação já usam essa tabela. |
| Título e gêneros das reações | Buscados no TMDB pelo servidor (`obterFilme`), como em `alternarReacao`. O navegador só envia os IDs. |
| Ordem da gravação | Primeiro as reações (`upsert`), depois a linha de `preferencias`. Essa linha marca o onboarding como concluído, então, se as reações falharem, a pessoa continua no wizard e pode tentar de novo. |
| Lista de streamings | Constante no código com ID do provedor no TMDB, nome e `logoPath`. Um teste de integração confere a constante contra `/watch/providers/movie?watch_region=BR` quando há token real (mesmo esquema da lista de gêneros). |
| Grades de pôsteres | Server Actions novas que chamam o cliente TMDB atual: `sugerirFilmesOnboarding` e `buscarFilmesOnboarding`. |
| Streamings no motor | Uma consulta `discover` nova com `with_watch_providers`, `watch_region=BR` e `with_watch_monetization_types=flatrate`. As outras seções **não** são filtradas por streaming. |
| Gêneros evitados no motor | `semGeneros` em toda consulta `discover`. Nas listas de parecidos (`/movie/{id}/recommendations`, que não aceita esse filtro), os filmes são removidos no código. |

### Banco

Migration nova em `supabase/migrations/`:

```sql
alter table public.preferencias
  add column generos_evitados int[] not null default '{}'
    check (cardinality(generos_evitados) <= 5)
    -- Os 19 gêneros de filme do TMDB (src/features/preferencias/generos.ts).
    check (generos_evitados <@ array[
      28, 16, 12, 10770, 35, 80, 99, 18, 10751, 14, 37, 878, 10752, 36, 9648, 10402, 10749, 27, 53
    ]),
  add column streamings int[] not null default '{}'
    check (cardinality(streamings) <= 10)
    check (array_position(streamings, null) is null),
  add constraint preferencias_evitados_fora_dos_favoritos
    check (not (generos && generos_evitados));
```

Os IDs de streaming não têm `check` de lista fechada no banco. A lista do TMDB muda com mais frequência que a de gêneros, e um ID que saiu do catálogo só deixa de trazer resultados, sem quebrar nada. O schema zod restringe os IDs à constante.

As políticas de RLS de `preferencias` e `reacoes` não mudam.

### Streamings

`src/features/preferencias/streamings.ts` exporta a lista, nesta ordem de exibição:

| ID (TMDB) | Nome |
|---|---|
| 8 | Netflix |
| 119 | Prime Video |
| 337 | Disney+ |
| 1899 | Max |
| 307 | Globoplay |
| 350 | Apple TV+ |
| 531 | Paramount+ |
| 283 | Crunchyroll |
| 11 | MUBI |

Se o teste contra o TMDB apontar outro nome ou outro ID para algum serviço (por exemplo, uma troca de marca), vale o que o TMDB diz e a tabela acima é corrigida. O limite de 10 do banco deixa folga para crescer a lista.

### Schema

`preferenciasSchema` (`src/features/preferencias/schema.ts`) ganha:

| Campo | Regra | Mensagem |
|---|---|---|
| `generosEvitados` | até 5 IDs da lista de gêneros, sem repetição, nenhum igual a um favorito | "Escolha até 5 gêneros para evitar, diferentes dos favoritos." |
| `streamings` | até 10 IDs da lista de streamings, sem repetição | "Escolha streamings da lista." |

O schema do onboarding (`onboardingSchema`) estende o de preferências com:

| Campo | Regra | Mensagem |
|---|---|---|
| `amados` | até 5 IDs do TMDB (inteiros positivos), sem repetição | "Escolha até 5 filmes que você ama." |
| `rejeitados` | até 5 IDs do TMDB, sem repetição, nenhum igual a um amado | "Escolha até 5 filmes que você não assistiria." |

Os nomes no banco seguem o padrão atual: `generos_evitados` e `streamings`.

### Wizard

Regras gerais (o que não está aqui continua como na spec `onboarding-preferencias`):

- "Passo N de 7" e barra de progresso.
- **Voltar** em todos os passos, menos no 1. Voltar mantém as escolhas já feitas.
- Nos passos opcionais (2, 5, 6 e 7), o botão de avançar diz **"Pular"** enquanto nada está marcado e **"Próximo"** depois que algo é marcado. No passo 7, o botão é sempre **"Concluir"**.
- Nada é salvo antes de "Concluir". Quem fecha a aba no meio recomeça do zero.
- O formulário envia `generos`, `generosEvitados`, `duracao`, `frequencia`, `streamings`, `amados` e `rejeitados` (as listas como vários valores) para `salvarPreferencias`.

**Passo 2: "Algum gênero que você não quer ver?"**

- Os mesmos chips do passo 1 (`aria-pressed`), **sem** os gêneros escolhidos no passo 1.
- Com 5 marcados, os outros ficam desabilitados e aparece "Você pode evitar até 5 gêneros.".
- Se a pessoa voltar ao passo 1 e marcar como favorito um gênero que estava evitado, ele sai dos evitados.

**Passo 5: "Quais streamings você assina?"**

- Grade com os serviços da lista: logo (via TMDB) e nome, como botões de alternância (`aria-pressed`, rótulo = nome do serviço).
- Sem limite visível: a lista tem menos de 10 itens.

**Passo 6: "Escolha filmes que você ama"**

- Subtítulo: "Marque até 5. Eles guiam as primeiras recomendações."
- **Grade:** 20 pôsteres de `sugerirFilmesOnboarding({ generos })`, que chama `descobrirFilmes` com os gêneros do passo 1, `votosMin: 1000`, ordem por popularidade, página 1.
- **Busca:** campo "Buscar um filme" que chama `buscarFilmesOnboarding(texto)` (usa `buscarFilmes`) 400 ms depois da última tecla, se houver ao menos 2 caracteres. Os resultados substituem a grade enquanto houver texto. Limpar o campo volta à grade.
- Cada pôster é um botão de alternância (`aria-pressed`, `aria-label="Marcar <título>"`). Marcado, ganha borda e ✓.
- Contador "N de 5". Com 5 marcados, os outros pôsteres ficam desabilitados.
- Os filmes marcados continuam marcados ao trocar entre grade e busca. Uma faixa acima da grade mostra os títulos marcados, cada um com um botão para desmarcar.

**Passo 7: "Pela capa, quais você não assistiria?"**

- Subtítulo: "Só pelo pôster mesmo. Isso ajuda a saber o que não te mostrar."
- **Grade:** 20 pôsteres de `sugerirFilmesOnboarding({ semGeneros: [...favoritos, ...evitados], excluir: amados })`, que chama `descobrirFilmes` sem os gêneros favoritos e evitados, `votosMin: 1000`, ordem por popularidade, página 1. Os filmes marcados no passo 6 nunca aparecem.
- Sem busca.
- Mesmos botões, contador "N de 5" e limite do passo 6.

**Falhas do TMDB nos passos 6 e 7:**

- A grade mostra "Não foi possível carregar os filmes." e um botão "Tentar de novo".
- "Pular" e "Concluir" continuam funcionando, para o cadastro não travar.
- `sugerirFilmesOnboarding` e `buscarFilmesOnboarding` exigem sessão e devolvem `{ filmes }` ou `{ erro: true }`, sem lançar exceção.

### Gravação (`salvarPreferencias`)

1. Valida com `onboardingSchema`. Se falhar, devolve a primeira mensagem, como hoje.
2. Busca no TMDB (`obterFilme`, em paralelo) o título e os gêneros de cada filme de `amados` e `rejeitados`. Se alguma busca falhar ou um filme não existir, devolve "Não foi possível salvar agora. Tente de novo." e não grava nada.
3. Faz o `upsert` em `reacoes`: `amei` para os amados e `nao-gostei` para os rejeitados.
4. Faz o `upsert` em `preferencias`, já com `generos_evitados` e `streamings`.
5. Redireciona para `/dashboard`.

Se o passo 3 der certo e o 4 falhar, as reações ficam gravadas. Isso é aceitável: um novo "Concluir" refaz os dois `upsert` sem duplicar nada.

### Motor (`src/features/recomendacao/`)

- `EntradaMotor.preferencias` ganha `generosEvitados: number[]` e `streamings: number[]`.
- `FiltrosDescoberta` ganha `provedores?: number[]`. Com a lista preenchida, `descobrirFilmes` envia `with_watch_providers` (IDs separados por `|`), `watch_region=BR` e `with_watch_monetization_types=flatrate`.
- **`planejar`:**
  - os filtros-base de todas as consultas `discover` levam `semGeneros: generosEvitados`;
  - com streamings escolhidos, entra uma consulta `{ tipo: "streamings" }` com os filtros-base, os gêneros favoritos, os provedores, página 1 e ordem por popularidade.
- **`gerarRecomendacoes`:**
  - a seção `{ id: "streamings", titulo: "Nos seus streamings" }` vem **primeiro**, antes de "Escolhidos para você", e escolhe filmes antes das outras, para os que estão nos streamings da pessoa ficarem nela;
  - o motivo de cada filme dessa seção é "Num dos seus streamings";
  - se a consulta falhar, a seção aparece com `erro: true`, como as outras; sem streamings escolhidos, a seção não existe;
  - os filmes das listas de parecidos que tenham algum gênero evitado são descartados antes do `agregarParecidos`.
- As reações "pela capa" usam o peso atual de "Não é pra mim" (−0,1 por gênero) e entram nos bloqueados. Não há regra especial.

### Me surpreenda

O globo passa a usar `semGeneros: [...favoritos, ...generosEvitados]`, em vez de só os favoritos.

### Perfil (`/perfil`)

- A seção "Suas preferências" ganha, nesta ordem, depois dos gêneros favoritos:
  - "Gêneros que você não quer ver": chips sem os favoritos marcados, até 5;
  - "Streamings que você assina": a mesma grade do passo 5.
- Usa os componentes do wizard e a action `atualizarPreferencias`, que passa a validar e gravar os dois campos novos.
- Desmarcar no perfil um gênero favorito não o marca como evitado. Marcar como favorito um gênero evitado tira esse gênero dos evitados.
- Filmes amados e "pela capa" **não** aparecem no perfil: são reações, e se editam onde as reações já se editam.

### Resumo no dashboard

O resumo das preferências não muda. Gêneros evitados e streamings não entram nele, para a linha não ficar longa.

## Critérios de aceitação

1. **Testes unitários** (`pnpm test`) passam, cobrindo pelo menos:
   - o wizard mostra "Passo N de 7". Nos passos 2, 5, 6 e 7, o botão diz "Pular" sem nada marcado e "Próximo" com algo marcado;
   - o passo 2 não mostra os gêneros favoritos e, com 5 marcados, desabilita os outros;
   - voltar ao passo 1 e marcar como favorito um gênero evitado tira esse gênero dos evitados;
   - no passo 6, com 5 filmes marcados os outros pôsteres ficam desabilitados e o contador mostra "5 de 5"; um filme marcado continua marcado depois de buscar e limpar a busca;
   - o passo 7 não mostra os filmes marcados no passo 6;
   - com falha nas sugestões, aparece "Não foi possível carregar os filmes." e "Pular" continua habilitado;
   - o schema recusa: gênero evitado igual a favorito, 6 evitados, streaming fora da lista, 6 amados, um filme ao mesmo tempo em amados e rejeitados;
   - `planejar`:
     - põe `semGeneros` com os evitados em todas as consultas `discover`;
     - cria a consulta de streamings só quando há streamings escolhidos;
   - `gerarRecomendacoes`:
     - põe "Nos seus streamings" como primeira seção, com o motivo "Num dos seus streamings";
     - descarta dos parecidos os filmes com gênero evitado;
   - o globo do "Me surpreenda" pede `semGeneros` com favoritos e evitados.
2. **Testes de integração** (`pnpm test:integration`) passam, provando que:
   - a migration aplica no banco existente (`supabase migration up`) e as linhas antigas de `preferencias` ficam com `generos_evitados = '{}'` e `streamings = '{}'`;
   - o banco recusa: evitado igual a favorito, 6 evitados, gênero evitado fora da lista, 11 streamings;
   - o usuário atualiza os próprios `generos_evitados` e `streamings`, e não os de outro usuário;
   - `descobrirFilmes` com `provedores: [8, 119]` envia `with_watch_providers=8|119`, `watch_region=BR` e `with_watch_monetization_types=flatrate`;
   - a lista de streamings bate com o TMDB (só com token real; senão o teste é pulado).
3. **Testes E2E** (`pnpm test:e2e`, TMDB falso, que ganha suporte a `with_watch_providers` e `without_genres`) passam:
   - um cadastro novo que marca Ação, evita Terror, marca Netflix, ama 2 filmes e rejeita 1 cai no dashboard. A primeira seção é "Nos seus streamings", há uma seção "Porque você amou <título>" e nenhum filme de Terror aparece;
   - um cadastro novo que pula os passos 2, 5, 6 e 7 cai no dashboard sem a seção "Nos seus streamings";
   - no `/perfil`, marcar Prime Video e salvar mostra "Alterações salvas." e o dashboard passa a ter "Nos seus streamings";
   - os testes E2E anteriores continuam passando (os que passam pelo onboarding são ajustados para os 7 passos).
4. `pnpm lint`, `pnpm typecheck`, `pnpm build` e `pnpm check:secrets` terminam sem erros, e o CI passa na `main`.

## Fora do escopo

| Item | Motivo / onde fica |
|---|---|
| Chave "Só nos meus streamings" que filtra o dashboard inteiro | **sugestão futura**: a seção própria resolve o caso principal sem esvaziar o dashboard de quem tem catálogo pequeno |
| Nome do serviço no motivo ("Disponível na Netflix") | **sugestão futura**: o `discover` não diz em qual provedor cada filme está; exigiria uma consulta por streaming |
| Época preferida (ex.: "anos 90") e origem/idioma | **não planejado agora**: decidido deixar de fora; pode virar ajuste opcional no perfil |
| Salvar o progresso do wizard no meio | **não planejado**: o wizard é curto e os passos novos são opcionais |
| Filmes amados e "pela capa" no `/perfil` | **não planejado**: já são reações, editáveis nas telas de reação |
| Filtrar a busca por gêneros evitados | **não planejado**: na busca a pessoa procura algo de propósito |
| Peso especial para as reações "pela capa" | **não planejado**: usam o peso de "Não é pra mim" |

## Impacto em outras specs

- **`onboarding-preferencias`:** o wizard passa a ter 7 passos e "Concluir" fica no passo 7. O critério E2E de onboarding é atualizado.
- **`motor-recomendacao`:** entram a seção "Nos seus streamings", os gêneros evitados em todas as consultas e o descarte nos parecidos.
- **`perfil`:** a seção de preferências ganha dois campos.
- **`me-surpreenda`:** o globo também evita os gêneros evitados.
- **`cliente-tmdb`:** `FiltrosDescoberta` ganha `provedores`.
