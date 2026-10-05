import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { FormularioNome } from "@/features/perfil/components/formulario-nome";
import { FormularioPreferencias } from "@/features/perfil/components/formulario-preferencias";

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
  const atuais = { generos: [28, 18], duracao: "media", frequencia: "semanal" } as const;

  it("vem com as preferências atuais marcadas", () => {
    render(<FormularioPreferencias atuais={{ ...atuais, generos: [...atuais.generos] }} />);
    expect(screen.getByRole("button", { name: "Ação" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Drama" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Terror" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("radio", { name: "Médios (90 a 120 min)" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Toda semana" })).toBeChecked();
  });

  it("trava no 5º gênero e desabilita salvar sem nenhum gênero", async () => {
    const usuario = userEvent.setup();
    render(<FormularioPreferencias atuais={{ ...atuais, generos: [...atuais.generos] }} />);

    for (const nome of ["Comédia", "Terror", "Thriller"]) {
      await usuario.click(screen.getByRole("button", { name: nome }));
    }
    expect(screen.getByRole("button", { name: "Romance" })).toBeDisabled();

    for (const nome of ["Ação", "Drama", "Comédia", "Terror", "Thriller"]) {
      await usuario.click(screen.getByRole("button", { name: nome }));
    }
    expect(screen.getByRole("button", { name: "Salvar preferências" })).toBeDisabled();
  });
});
