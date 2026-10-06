// TMDB falso para os testes E2E: respostas determinísticas, sem rede e sem pôsteres.
// Uso: node tests/e2e/tmdb-falso/servidor.mjs [porta]   (padrão 4010)
import { createServer } from "node:http";

const PORTA = Number(process.argv[2] ?? process.env.TMDB_FALSO_PORTA ?? 4010);
const GENERO_QUE_FALHA = "99"; // Documentário: sempre 503, para testar seção com erro.

const NOMES = {
  28: "Ação",
  16: "Animação",
  12: "Aventura",
  10770: "Cinema TV",
  35: "Comédia",
  80: "Crime",
  99: "Documentário",
  18: "Drama",
  10751: "Família",
  14: "Fantasia",
  37: "Faroeste",
  878: "Ficção científica",
  10752: "Guerra",
  36: "História",
  9648: "Mistério",
  10402: "Música",
  10749: "Romance",
  27: "Terror",
  53: "Thriller",
};

function filme(id, titulo, genero, posicao) {
  return {
    id,
    title: titulo,
    original_title: titulo,
    overview: `Sinopse de ${titulo}.`,
    // Pôster só nos IDs pares: o globo do "Me surpreenda" descarta filmes sem pôster.
    poster_path: id % 2 === 0 ? `/falso-${id}.jpg` : null,
    backdrop_path: null,
    genre_ids: [genero],
    release_date: `${2000 + (id % 25)}-01-01`,
    vote_average: 6 + ((id * 7) % 40) / 10,
    vote_count: 500 + posicao * 10,
    popularity: 100 - posicao * 3,
    adult: false,
  };
}

function pagina(resultados, numero) {
  return { page: numero, results: resultados, total_pages: 50, total_results: 1000 };
}

function responder(res, status, corpo) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(corpo));
}

const servidor = createServer((req, res) => {
  if (!req.headers.authorization?.startsWith("Bearer ")) {
    return responder(res, 401, { status_message: "Sem token" });
  }

  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);

  if (url.pathname === "/3/discover/movie") {
    // Sem with_genres, usa o primeiro gênero (na ordem de NOMES) que não está em without_genres.
    const sem = (url.searchParams.get("without_genres") ?? "").split(",").filter(Boolean);
    const padrao = Object.keys(NOMES).find((id) => !sem.includes(id)) ?? "18";
    const generos = url.searchParams.get("with_genres") ?? padrao;
    if (generos === GENERO_QUE_FALHA) return responder(res, 503, { status_message: "Falha" });
    const genero = Number(generos.split(/[|,]/)[0]);
    const numero = Number(url.searchParams.get("page") ?? 1);
    const nome = NOMES[genero] ?? `Gênero ${genero}`;
    // Com with_watch_providers, filmes só desta consulta ("Nos seus streamings").
    const streaming = url.searchParams.has("with_watch_providers");
    const filmes = Array.from({ length: 20 }, (_, i) =>
      streaming
        ? filme(800000 + numero * 20 + i, `No streaming ${numero}-${i + 1}`, genero, i)
        : filme(genero * 1000 + numero * 20 + i, `${nome} ${numero}-${i + 1}`, genero, i),
    );
    return responder(res, 200, pagina(filmes, numero));
  }

  if (url.pathname === "/3/search/movie") {
    const texto = url.searchParams.get("query") ?? "";
    const numero = Number(url.searchParams.get("page") ?? 1);
    if (texto.includes("nada")) {
      return responder(res, 200, { page: 1, results: [], total_pages: 0, total_results: 0 });
    }
    const filmes = Array.from({ length: 20 }, (_, i) =>
      filme(500000 + numero * 20 + i, `${texto} ${numero}-${i + 1}`, 878, i),
    );
    return responder(res, 200, {
      page: numero,
      results: filmes,
      total_pages: 3,
      total_results: 55,
    });
  }

  const detalhes = url.pathname.match(/^\/3\/movie\/(\d+)$/);
  if (detalhes) {
    const id = Number(detalhes[1]);
    if (id >= 999000000) return responder(res, 404, { status_code: 34 });
    const base = filme(id, `Filme ${id}`, 18, 0);
    delete base.genre_ids;
    return responder(res, 200, {
      ...base,
      overview: `Sinopse do Filme ${id}.`,
      genres: [
        { id: 18, name: "Drama" },
        { id: 28, name: "Ação" },
      ],
      runtime: 125,
      tagline: "Um slogan de teste.",
      videos: {
        results: [{ key: "trailer-falso", site: "YouTube", type: "Trailer", official: true }],
      },
      credits: {
        cast: [
          { name: "Atriz Um", character: "Heroína", profile_path: null },
          { name: "Ator Dois", character: "Vilão", profile_path: null },
          { name: "Atriz Três", character: "Mentora", profile_path: null },
        ],
        crew: [{ name: "Diretora Teste", job: "Director" }],
      },
      "watch/providers": {
        results: {
          BR: {
            link: `https://www.themoviedb.org/movie/${id}/watch?locale=BR`,
            flatrate: [{ provider_id: 8, provider_name: "Netflix", logo_path: null }],
            rent: [{ provider_id: 2, provider_name: "Apple TV", logo_path: null }],
          },
        },
      },
      recommendations: pagina(
        Array.from({ length: 5 }, (_, i) => filme(id * 10 + i, `Parecido ${id}-${i + 1}`, 18, i)),
        1,
      ),
    });
  }

  const recomendacoes = url.pathname.match(/^\/3\/movie\/(\d+)\/recommendations$/);
  if (recomendacoes) {
    const origem = Number(recomendacoes[1]);
    const filmes = Array.from({ length: 10 }, (_, i) =>
      filme(origem * 100 + i, `Parecido ${origem}-${i + 1}`, 18, i),
    );
    return responder(res, 200, pagina(filmes, 1));
  }

  responder(res, 404, { status_message: "Não encontrado" });
});

servidor.listen(PORTA, "127.0.0.1", () => {
  console.log(`TMDB falso em http://127.0.0.1:${PORTA}/3`);
});
