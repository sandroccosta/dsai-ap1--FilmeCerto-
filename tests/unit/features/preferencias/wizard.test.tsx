import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { salvarPreferencias } from "@/features/preferencias/actions";
import { OnboardingWizard } from "@/features/preferencias/components/onboarding-wizard";
import {
  buscarFilmesOnboarding,
  sugerirFilmesOnboarding,
  type FilmeOpcao,
} from "@/features/preferencias/filmes-onboarding";

vi.mock("@/features/preferencias/actions", () => ({
  salvarPreferencias: vi.fn(async () => ({})),
}));
vi.mock("@/features/preferencias/filmes-onboarding", () => ({
  sugerirFilmesOnboarding: vi.fn(),
  buscarFilmesOnboarding: vi.fn(),
}));

const opcao = (id: number): FilmeOpcao => ({
  id,
  titulo: `Filme ${id}`,
  ano: 2020,
  posterPath: `/p${id}.jpg`,
});
const ids = (de: number, ate: number) => Array.from({ length: ate - de + 1 }, (_, i) => de + i);

beforeEach(() => {
  vi.mocked(salvarPreferencias).mockClear();
  // Passo 6 (com gêneros): filmes 1 a 20. Passo 7 (sem gêneros): filmes 1 a 5 e 101 a 115;
  // nas outras páginas do passo 7, 201 a 215, 301 a 315...
  vi.mocked(sugerirFilmesOnboarding)
    .mockReset()
    .mockImplementation(async ({ generos, pagina = 1 }) => ({
      filmes: (generos
        ? ids(1, 20)
        : pagina === 1
          ? [...ids(1, 5), ...ids(101, 115)]
          : ids(pagina * 100 + 1, pagina * 100 + 15)
      ).map(opcao),
    }));
  vi.mocked(buscarFilmesOnboarding)
    .mockReset()
    .mockImplementation(async () => ({ filmes: [opcao(500)] }));
});

const botao = (nome: string) => screen.getByRole("button", { name: nome });
const avancar = () => screen.getByRole("button", { name: /^(Próximo|Pular)$/ });

/** Marca Ação, evita Terror (opcional), escolhe duração e frequência e para no passo pedido. */
async function irAte(passo: number, usuario = userEvent.setup()) {
  render(<OnboardingWizard />);
  await usuario.click(botao("Ação"));
  if (passo === 1) return usuario;
  await usuario.click(avancar());
  if (passo === 2) return usuario;
  await usuario.click(avancar());
  await usuario.click(screen.getByRole("radio", { name: "Tanto faz" }));
  if (passo === 3) return usuario;
  await usuario.click(avancar());
  await usuario.click(screen.getByRole("radio", { name: "Toda semana" }));
  if (passo === 4) return usuario;
  await usuario.click(avancar());
  if (passo === 5) return usuario;
  await usuario.click(avancar());
  await screen.findByRole("button", { name: "Marcar Filme 1" });
  if (passo === 6) return usuario;
  await usuario.click(avancar());
  await screen.findByRole("button", { name: "Marcar Filme 101" });
  return usuario;
}

describe("OnboardingWizard", () => {
  it("só libera o Próximo depois de escolher um gênero", async () => {
    const usuario = userEvent.setup();
    render(<OnboardingWizard />);

    expect(screen.getByText("Passo 1 de 7")).toBeInTheDocument();
    const proximo = botao("Próximo");
    expect(proximo).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Voltar" })).not.toBeInTheDocument();

    await usuario.click(botao("Drama"));
    expect(botao("Drama")).toHaveAttribute("aria-pressed", "true");
    expect(proximo).toBeEnabled();
  });

  it("trava os outros gêneros ao chegar em 5 e avisa o limite", async () => {
    const usuario = userEvent.setup();
    render(<OnboardingWizard />);

    for (const nome of ["Ação", "Drama", "Comédia", "Terror", "Thriller"]) {
      await usuario.click(botao(nome));
    }

    expect(botao("Romance")).toBeDisabled();
    expect(botao("Ação")).toBeEnabled();
    expect(screen.getByText("Você pode escolher até 5 gêneros.")).toBeInTheDocument();

    await usuario.click(botao("Ação"));
    expect(botao("Romance")).toBeEnabled();
  });

  it("o passo 2 esconde os favoritos e troca Pular por Próximo ao marcar um gênero", async () => {
    const usuario = await irAte(2);

    expect(screen.getByText("Passo 2 de 7")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Algum gênero que você não quer ver?" }));
    expect(screen.queryByRole("button", { name: "Ação" })).not.toBeInTheDocument();
    expect(botao("Pular")).toBeEnabled();

    await usuario.click(botao("Terror"));
    expect(botao("Terror")).toHaveAttribute("aria-pressed", "true");
    expect(botao("Próximo")).toBeEnabled();
  });

  it("o passo 2 trava em 5 gêneros evitados", async () => {
    const usuario = await irAte(2);
    for (const nome of ["Terror", "Thriller", "Guerra", "Faroeste", "Música"]) {
      await usuario.click(botao(nome));
    }
    expect(botao("Romance")).toBeDisabled();
    expect(screen.getByText("Você pode evitar até 5 gêneros.")).toBeInTheDocument();
  });

  it("um gênero evitado que vira favorito sai dos evitados", async () => {
    const usuario = await irAte(2);
    await usuario.click(botao("Terror"));

    await usuario.click(botao("Voltar"));
    await usuario.click(botao("Terror"));
    await usuario.click(botao("Próximo"));

    expect(screen.queryByRole("button", { name: "Terror" })).not.toBeInTheDocument();
    expect(botao("Pular")).toBeInTheDocument();
  });

  it("Voltar mantém as escolhas", async () => {
    const usuario = await irAte(3);
    expect(screen.getByText("Passo 3 de 7")).toBeInTheDocument();

    await usuario.click(botao("Voltar"));
    await usuario.click(botao("Voltar"));
    expect(screen.getByText("Passo 1 de 7")).toBeInTheDocument();
    expect(botao("Ação")).toHaveAttribute("aria-pressed", "true");
  });

  it("duração e frequência são obrigatórias", async () => {
    const usuario = userEvent.setup();
    render(<OnboardingWizard />);
    await usuario.click(botao("Ação"));
    await usuario.click(botao("Próximo"));
    await usuario.click(botao("Pular"));

    expect(screen.getByRole("radiogroup", { name: "Duração preferida" })).toBeInTheDocument();
    expect(botao("Próximo")).toBeDisabled();
  });

  it("o passo 5 lista os streamings como botões de alternância", async () => {
    const usuario = await irAte(5);

    expect(screen.getByText("Passo 5 de 7")).toBeInTheDocument();
    expect(botao("Pular")).toBeEnabled();
    await usuario.click(botao("Netflix"));
    expect(botao("Netflix")).toHaveAttribute("aria-pressed", "true");
    expect(botao("Próximo")).toBeEnabled();
  });

  it("o passo 6 sugere filmes dos gêneros favoritos e trava em 5", async () => {
    const usuario = await irAte(6);

    expect(sugerirFilmesOnboarding).toHaveBeenCalledWith({ generos: [28], pagina: 1 });
    expect(screen.getByText("0 de 5")).toBeInTheDocument();
    for (const id of ids(1, 5)) await usuario.click(botao(`Marcar Filme ${id}`));

    expect(screen.getByText("5 de 5")).toBeInTheDocument();
    expect(botao("Marcar Filme 6")).toBeDisabled();
    expect(botao("Marcar Filme 1")).toHaveAttribute("aria-pressed", "true");
    expect(botao("Próximo")).toBeEnabled();
  });

  it("a busca do passo 6 troca a grade, e o filme marcado continua marcado ao limpar", async () => {
    const usuario = await irAte(6);
    await usuario.click(botao("Marcar Filme 2"));

    await usuario.type(screen.getByRole("searchbox", { name: "Buscar um filme" }), "matrix");
    await usuario.click(await screen.findByRole("button", { name: "Marcar Filme 500" }));
    expect(buscarFilmesOnboarding).toHaveBeenLastCalledWith("matrix");
    expect(screen.queryByRole("button", { name: "Marcar Filme 3" })).not.toBeInTheDocument();
    expect(screen.getByText("2 de 5")).toBeInTheDocument();

    await usuario.clear(screen.getByRole("searchbox", { name: "Buscar um filme" }));
    expect(await screen.findByRole("button", { name: "Marcar Filme 2" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    const escolhidos = screen.getByRole("list", { name: "Filmes marcados" });
    expect(within(escolhidos).getByText("Filme 500")).toBeInTheDocument();
    await usuario.click(within(escolhidos).getByRole("button", { name: "Desmarcar Filme 500" }));
    expect(screen.getByText("1 de 5")).toBeInTheDocument();
  });

  it("o passo 7 busca fora dos favoritos e evitados e não mostra os filmes amados", async () => {
    const usuario = userEvent.setup();
    render(<OnboardingWizard />);
    await usuario.click(botao("Ação"));
    await usuario.click(botao("Próximo"));
    await usuario.click(botao("Terror"));
    await usuario.click(botao("Próximo"));
    await usuario.click(screen.getByRole("radio", { name: "Tanto faz" }));
    await usuario.click(botao("Próximo"));
    await usuario.click(screen.getByRole("radio", { name: "Toda semana" }));
    await usuario.click(botao("Próximo"));
    await usuario.click(botao("Pular"));
    await usuario.click(await screen.findByRole("button", { name: "Marcar Filme 1" }));
    await usuario.click(botao("Próximo"));

    expect(screen.getByText("Passo 7 de 7")).toBeInTheDocument();
    await screen.findByRole("button", { name: "Marcar Filme 101" });
    expect(sugerirFilmesOnboarding).toHaveBeenLastCalledWith({ semGeneros: [28, 27], pagina: 1 });
    expect(screen.queryByRole("button", { name: "Marcar Filme 1" })).not.toBeInTheDocument();
    expect(botao("Marcar Filme 2")).toBeInTheDocument();
    expect(botao("Concluir")).toBeEnabled();
  });

  it("o passo 6 não tem o botão de trocar os filmes", async () => {
    await irAte(6);
    expect(screen.queryByRole("button", { name: "Mostrar outros filmes" })).not.toBeInTheDocument();
  });

  it("no passo 7, 'Mostrar outros filmes' traz a próxima página e mantém os marcados", async () => {
    const usuario = await irAte(7);
    await usuario.click(botao("Marcar Filme 101"));

    await usuario.click(botao("Mostrar outros filmes"));
    expect(await screen.findByRole("button", { name: "Marcar Filme 201" })).toBeInTheDocument();
    expect(sugerirFilmesOnboarding).toHaveBeenLastCalledWith({ semGeneros: [28], pagina: 2 });
    expect(screen.queryByRole("button", { name: "Marcar Filme 101" })).not.toBeInTheDocument();

    const escolhidos = screen.getByRole("list", { name: "Filmes marcados" });
    expect(within(escolhidos).getByText("Filme 101")).toBeInTheDocument();
    expect(screen.getByText("1 de 5")).toBeInTheDocument();
  });

  it("depois da página 5, 'Mostrar outros filmes' volta para a 1", async () => {
    const usuario = await irAte(7);
    for (let pagina = 2; pagina <= 5; pagina++) {
      await usuario.click(botao("Mostrar outros filmes"));
      await screen.findByRole("button", { name: `Marcar Filme ${pagina * 100 + 1}` });
    }
    await usuario.click(botao("Mostrar outros filmes"));
    expect(await screen.findByRole("button", { name: "Marcar Filme 101" })).toBeInTheDocument();
    expect(sugerirFilmesOnboarding).toHaveBeenLastCalledWith({ semGeneros: [28], pagina: 1 });
  });

  it("se as sugestões falham, avisa, permite tentar de novo e não trava o Pular", async () => {
    vi.mocked(sugerirFilmesOnboarding).mockResolvedValueOnce({ erro: true });
    const usuario = await irAte(5);
    await usuario.click(botao("Pular"));

    expect(await screen.findByText("Não foi possível carregar os filmes.")).toBeInTheDocument();
    expect(botao("Pular")).toBeEnabled();

    await usuario.click(botao("Tentar de novo"));
    expect(await screen.findByRole("button", { name: "Marcar Filme 1" })).toBeInTheDocument();
  });

  it("Concluir envia todas as respostas", async () => {
    const usuario = userEvent.setup();
    render(<OnboardingWizard />);
    await usuario.click(botao("Ação"));
    await usuario.click(botao("Drama"));
    await usuario.click(botao("Próximo"));
    await usuario.click(botao("Terror"));
    await usuario.click(botao("Próximo"));
    await usuario.click(screen.getByRole("radio", { name: "Tanto faz" }));
    await usuario.click(botao("Próximo"));
    await usuario.click(screen.getByRole("radio", { name: "Toda semana" }));
    await usuario.click(botao("Próximo"));
    await usuario.click(botao("Netflix"));
    await usuario.click(botao("Próximo"));
    await usuario.click(await screen.findByRole("button", { name: "Marcar Filme 3" }));
    await usuario.click(botao("Próximo"));
    await usuario.click(await screen.findByRole("button", { name: "Marcar Filme 101" }));
    await usuario.click(botao("Concluir"));

    await waitFor(() => expect(salvarPreferencias).toHaveBeenCalledTimes(1));
    const dados = vi.mocked(salvarPreferencias).mock.calls[0]?.[1] as FormData;
    expect(dados.getAll("generos")).toEqual(["28", "18"]);
    expect(dados.getAll("generosEvitados")).toEqual(["27"]);
    expect(dados.get("duracao")).toBe("indiferente");
    expect(dados.get("frequencia")).toBe("semanal");
    expect(dados.getAll("streamings")).toEqual(["8"]);
    expect(dados.getAll("amados")).toEqual(["3"]);
    expect(dados.getAll("rejeitados")).toEqual(["101"]);
  });
});
