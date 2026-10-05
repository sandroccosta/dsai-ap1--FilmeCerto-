# Spec: Cliente do TMDB

- **Data:** 2026-10-05
- **Componente:** cliente-tmdb
- **Status:** aprovada para implementação
- **Substitui:** nenhuma

## O quê

Um módulo do servidor que conversa com a API v3 do **TMDB** e entrega ao resto do **Filme Certo** dados de filmes já validados e em tipos do próprio projeto. Ele cobre:

- descobrir filmes por filtros (gêneros, duração, nota, ordem);
- obter os detalhes de um filme, com trailer, elenco, direção, onde assistir no Brasil e filmes parecidos;
- listar recomendações a partir de um filme;
- buscar filmes por título;
- montar URLs de imagens.

Nenhuma tela usa o módulo nesta spec. Ele é a base de `motor-recomendacao`, `dashboard`, `detalhes-filme` e `busca`.

## Por quê

O MovieMatch antigo usava a OMDb:

- fazia cerca de 100 chamadas a cada carregamento do dashboard, sem cache, num plano de 1.000 chamadas por dia;
- buscava filmes por título, não por ID;
- dependia de um catálogo fixo no código, com uns 10 filmes por gênero.

O TMDB tem busca por gênero e duração, catálogo real, imagens e "onde assistir" no Brasil. Centralizar o acesso num módulo único garante que:

- o token nunca chega ao navegador;
- toda chamada tem timeout, novas tentativas e cache;
- as telas recebem dados validados, sem `undefined` inesperado quando a API muda;
- o resto do código não depende do formato JSON do TMDB.

## Decisões técnicas

| Tema | Decisão |
|---|---|
| Autenticação | Header `Authorization: Bearer <TMDB_READ_TOKEN>`; a `api_key` na URL não é usada |
| Isolamento | `src/lib/tmdb/cliente.ts` e `filmes.ts` importam `server-only` |
| Idioma e região | Toda chamada leva `language=pt-BR`; `discover` e `search` levam também `region=BR` e `include_adult=false` |
| Cache | Só o cache de dados do `fetch` do Next (`next: { revalidate }`), compartilhado entre usuários. Sem tabela no banco. |
| Validação | zod nas respostas; os dados são convertidos para tipos em pt-BR |
| URL base | `TMDB_API_URL` (opcional), padrão `https://api.themoviedb.org/3` |

### Arquivos

```
src/lib/tmdb/
  cliente.ts    requisição HTTP: URL, header, timeout, novas tentativas, cache, TmdbErro
  filmes.ts     funções de alto nível (abaixo)
  esquemas.ts   schemas zod das respostas do TMDB
  tipos.ts      tipos do domínio (FilmeResumo, FilmeDetalhes, Pagina...)
  imagens.ts    urlImagem(); sem server-only, pode ser usado no navegador
```

### Funções

| Função | Endpoint | `revalidate` |
|---|---|---|
| `descobrirFilmes(filtros)` | `GET /discover/movie` | 6 h |
| `obterFilme(id)` | `GET /movie/{id}?append_to_response=videos,credits,watch/providers,recommendations` | 24 h |
| `recomendacoesDe(id, pagina?)` | `GET /movie/{id}/recommendations` | 24 h |
| `buscarFilmes(texto, pagina?)` | `GET /search/movie` | 6 h |

Filtros de `descobrirFilmes`, todos opcionais:

| Filtro | Parâmetro do TMDB |
|---|---|
| `generos: number[]` | `with_genres`, unidos por `\|` (qualquer um deles) |
| `semGeneros: number[]` | `without_genres`, unidos por `,` |
| `duracaoMin`, `duracaoMax` (minutos) | `with_runtime.gte`, `with_runtime.lte` |
| `notaMin` | `vote_average.gte` |
| `votosMin` | `vote_count.gte` |
| `ordem`: `popularidade`, `nota` ou `lancamento` | `sort_by`: `popularity.desc`, `vote_average.desc`, `primary_release_date.desc` (padrão `popularidade`) |
| `pagina` | `page` (padrão 1; valores fora de 1 a 500 viram o limite mais próximo) |

`buscarFilmes` com texto vazio (depois de remover espaços) devolve uma página vazia sem chamar a API.

### Tipos do domínio

```ts
type FilmeResumo = {
  id: number;
  titulo: string;
  tituloOriginal: string;
  sinopse: string;
  posterPath: string | null;
  backdropPath: string | null;
  generos: number[];
  ano: number | null;        // de release_date; null se vazia
  nota: number;              // vote_average
  votos: number;             // vote_count
  popularidade: number;
};

type Pagina<T> = { itens: T[]; pagina: number; totalPaginas: number; totalResultados: number };

type Provedor = { id: number; nome: string; logoPath: string | null };

type FilmeDetalhes = Omit<FilmeResumo, "generos"> & {
  generos: { id: number; nome: string }[];
  duracaoMin: number | null;            // runtime; null se 0 ou ausente
  slogan: string | null;                // tagline; null se vazio
  trailerYoutube: string | null;        // key do primeiro vídeo oficial "Trailer" do YouTube;
                                        // senão, do primeiro "Trailer" do YouTube; senão null
  elenco: { nome: string; personagem: string; fotoPath: string | null }[]; // até 10, pela ordem
  direcao: string[];                    // nomes com job "Director"
  ondeAssistir: {                       // watch/providers, só a região BR; null se BR ausente
    link: string;
    assinatura: Provedor[];             // flatrate
    aluguel: Provedor[];                // rent
    compra: Provedor[];                 // buy
  } | null;
  parecidos: FilmeResumo[];             // recommendations, até 20
};
```

### Erros e novas tentativas

- **Timeout** de 8 s por tentativa (`AbortSignal.timeout`).
- **Novas tentativas:** até 2, nos casos de HTTP 429, HTTP 5xx, timeout e falha de rede.
  - Espera antes da 1ª nova tentativa: 500 ms; antes da 2ª: 1.000 ms.
  - No 429 com `Retry-After` (segundos), espera esse tempo, limitado a 5 s.
  - Não repete em 400, 401, 403 ou 404.
- **404:** `obterFilme` devolve `null`. Nas outras funções, vira `TmdbErro`.
- **Demais falhas:** lançam `TmdbErro`, com `status` (HTTP, ou `null` para timeout/rede/formato) e uma mensagem sem o token. O erro é registrado no log do servidor com o caminho chamado, sem a query nem o header.
- **Formato inesperado:** se a resposta não passa no schema zod, vira `TmdbErro` com `status: null` e mensagem "Resposta inesperada do TMDB".
- Campos opcionais que o TMDB costuma omitir ou mandar vazios (`poster_path`, `release_date`, `runtime`, `tagline`, `profile_path`) não causam erro: viram `null`.

### Imagens

`urlImagem(path, tamanho)` devolve `https://image.tmdb.org/t/p/{tamanho}{path}`, ou `null` quando `path` é `null`. Tamanhos aceitos: `w92`, `w185`, `w342`, `w500`, `w780`, `w1280`, `original`.

### Variáveis de ambiente

| Variável | Obrigatória | Uso |
|---|---|---|
| `TMDB_READ_TOKEN` | sim (já existia) | Bearer token |
| `TMDB_API_URL` | não | URL base da API; padrão `https://api.themoviedb.org/3`. Permite apontar os testes E2E das próximas specs para um TMDB falso. |

`TMDB_API_URL` entra no schema de `src/lib/env.ts` como URL opcional e no `.env.example`.

## Critérios de aceitação

1. **Testes unitários** (`pnpm test`, com `fetch` falso e sem rede) passam, cobrindo pelo menos:
   - `descobrirFilmes({ generos: [28, 18], semGeneros: [27], duracaoMin: 90, duracaoMax: 120, notaMin: 6, votosMin: 100, ordem: "nota", pagina: 2 })` chama `/discover/movie` com `with_genres=28|18`, `without_genres=27`, `with_runtime.gte=90`, `with_runtime.lte=120`, `vote_average.gte=6`, `vote_count.gte=100`, `sort_by=vote_average.desc`, `page=2`, `language=pt-BR`, `region=BR`, `include_adult=false`;
   - toda chamada envia `Authorization: Bearer <token>` e `next.revalidate` com o valor da tabela;
   - `pagina` 0 vira 1 e 600 vira 500;
   - a resposta do `discover` vira `Pagina<FilmeResumo>` com `ano` extraído da data e `null` para data vazia;
   - `obterFilme` converte duração, gêneros, slogan vazio, trailer (prefere o oficial), elenco limitado a 10, direção, onde assistir no BR e parecidos;
   - `obterFilme` devolve `ondeAssistir: null` quando não há dados para BR;
   - `obterFilme` devolve `null` para 404;
   - 429 seguido de 200 devolve os dados (uma nova tentativa); 503, 503, 503 lança `TmdbErro` com `status: 503` depois de 3 chamadas;
   - 401 lança `TmdbErro` com `status: 401` depois de 1 chamada;
   - timeout e falha de rede são repetidos e, persistindo, lançam `TmdbErro` com `status: null`;
   - resposta fora do formato lança `TmdbErro` "Resposta inesperada do TMDB";
   - a mensagem de nenhum `TmdbErro` contém o token;
   - `buscarFilmes("   ")` devolve página vazia sem chamar `fetch`;
   - `urlImagem("/abc.jpg", "w342")` devolve `https://image.tmdb.org/t/p/w342/abc.jpg`, e `urlImagem(null, "w342")` devolve `null`;
   - `TMDB_API_URL` muda a URL base das chamadas.
2. **Testes de integração** (`pnpm test:integration`), pulados quando não há token real ou quando rodam no CI, passam:
   - `descobrirFilmes({ generos: [18] })` devolve ao menos 1 filme, todos com 18 em `generos`;
   - `obterFilme(550)` devolve um filme com título não vazio, `duracaoMin` maior que 0 e `trailerYoutube` não nulo;
   - `obterFilme(999999999)` devolve `null`.
3. Nenhum arquivo de `src/lib/tmdb/` exceto `imagens.ts` pode ser importado por um Client Component: os outros importam `server-only`, e o build falha se isso acontecer.
4. `pnpm lint`, `pnpm typecheck`, `pnpm build` e `pnpm check:secrets` terminam sem erros, e o CI passa na `main`.

## Fora do escopo

| Item | Onde fica |
|---|---|
| Telas que mostram filmes (carrosséis, página do filme, busca, listas) | specs `dashboard`, `detalhes-filme`, `busca` e `listas` |
| Escolher quais filmes recomendar e por quê | spec `motor-recomendacao` |
| TMDB falso para os testes E2E | spec `dashboard`, a primeira tela que consome o cliente |
| Cache de filmes no Postgres (tabela `filmes_cache`) | **descartado**: o cache do `fetch` do Next basta |
| Séries de TV | **não faz parte do produto**: o Filme Certo é só de filmes |
| Login de usuário no TMDB (sessões, avaliações no TMDB) | **não faz parte do produto**: contas e avaliações ficam no Supabase |
