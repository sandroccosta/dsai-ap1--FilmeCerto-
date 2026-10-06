import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { FormularioNome } from "@/features/perfil/components/formulario-nome";
import { FormularioPreferencias } from "@/features/perfil/components/formulario-preferencias";
import type { PreferenciasInput } from "@/features/preferencias/schema";

const acoes = vi.hoisted(() => ({
  atualizarNome: vi.fn(async () => ({ ok: true })),
  atualizarPreferencias: vi.fn(async () => ({ ok: true })),
}));
vi.mock("@/features/perfil/actions", () => acoes);

describe("FormularioNome", () => {
  it("vem preenchido e valida no cliente sem chamar o servidor", async () => {
    const usuario = userEvent.setup();
    render(<FormularioNome nome="Ana Souza" email="ana@example.com" />);

    const campo = screen.getByLabelText("Nome");
    expect(campo).toHaveValue("Ana Souza");
    expect(screen.getByText("ana@example.com")).toBeInTheDocument();

    await usuario.clear(campo);
    await usuario.type(campo, "A");
    await usuario.click(screen.getByRole("button", { name: "Salvar nome" }));

    expect(await screen.findByText("Informe um nome entre 2 e 50 caracteres.")).toBeInTheDocument();
    expect(campo).toHaveAttribute("aria-invalid", "true");
    expect(acoes.atualizarNome).not.toHaveBeenCalled();
  });

  it("mostra 'Alterações salvas.' quando o servidor confirma", async () => {
    const usuario = userEvent.setup();
    render(<FormularioNome nome="Ana Souza" email="ana@example.com" />);
    await usuario.click(screen.getByRole("button", { name: "Salvar nome" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Alterações salvas.");
  });
});

describe("FormularioPreferencias", () => {
  const atuais: PreferenciasInput = {
    generos: [28, 18],
    generosEvitados: [27],
    duracao: "media",
    frequencia: "semanal",
    streamings: [8],
  };

  const grupo = (nome: string) => within(screen.getByRole("group", { name: nome }));
  const favoritos = () => grupo("Gêneros favoritos");
  const evitados = () => grupo("Gêneros que você não quer ver");

  it("vem com as preferências atuais marcadas", () => {
    render(<FormularioPreferencias atuais={atuais} />);
    expect(favoritos().getByRole("button", { name: "Ação" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(favoritos().getByRole("button", { name: "Drama" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(favoritos().getByRole("button", { name: "Terror" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("radio", { name: "Médios (90 a 120 min)" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Toda semana" })).toBeChecked();
  });

  it("vem com os gêneros evitados e os streamings atuais, sem os favoritos entre os evitados", () => {
    render(<FormularioPreferencias atuais={atuais} />);
    expect(evitados().getByRole("button", { name: "Terror" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(evitados().queryByRole("button", { name: "Ação" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Netflix" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Globoplay" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("marcar como favorito um gênero evitado tira ele dos evitados", async () => {
    const usuario = userEvent.setup();
    render(<FormularioPreferencias atuais={atuais} />);

    await usuario.click(favoritos().getByRole("button", { name: "Terror" }));
    expect(evitados().queryByRole("button", { name: "Terror" })).not.toBeInTheDocument();

    await usuario.click(favoritos().getByRole("button", { name: "Terror" }));
    expect(evitados().getByRole("button", { name: "Terror" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("trava no 5º gênero e desabilita salvar sem nenhum gênero", async () => {
    const usuario = userEvent.setup();
    render(<FormularioPreferencias atuais={atuais} />);

    for (const nome of ["Comédia", "Terror", "Thriller"]) {
      await usuario.click(favoritos().getByRole("button", { name: nome }));
    }
    expect(favoritos().getByRole("button", { name: "Romance" })).toBeDisabled();

    for (const nome of ["Ação", "Drama", "Comédia", "Terror", "Thriller"]) {
      await usuario.click(favoritos().getByRole("button", { name: nome }));
    }
    expect(screen.getByRole("button", { name: "Salvar preferências" })).toBeDisabled();
  });

  it("envia os gêneros evitados e os streamings ao salvar", async () => {
    const usuario = userEvent.setup();
    render(<FormularioPreferencias atuais={atuais} />);

    await usuario.click(evitados().getByRole("button", { name: "Guerra" }));
    await usuario.click(screen.getByRole("button", { name: "Netflix" }));
    await usuario.click(screen.getByRole("button", { name: "Globoplay" }));
    await usuario.click(screen.getByRole("button", { name: "Salvar preferências" }));

    await waitFor(() => expect(acoes.atualizarPreferencias).toHaveBeenCalled());
    const dados = (
      acoes.atualizarPreferencias.mock.lastCall as unknown[] | undefined
    )?.[1] as FormData;
    expect(dados.getAll("generosEvitados")).toEqual(["27", "10752"]);
    expect(dados.getAll("streamings")).toEqual(["307"]);
  });
});
