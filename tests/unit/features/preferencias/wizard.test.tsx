import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { OnboardingWizard } from "@/features/preferencias/components/onboarding-wizard";

vi.mock("@/features/preferencias/actions", () => ({ salvarPreferencias: vi.fn() }));

function genero(nome: string) {
  return screen.getByRole("button", { name: nome });
}

describe("OnboardingWizard", () => {
  it("só libera o Próximo depois de escolher um gênero", async () => {
    const usuario = userEvent.setup();
    render(<OnboardingWizard />);

    const proximo = screen.getByRole("button", { name: "Próximo" });
    expect(proximo).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Voltar" })).not.toBeInTheDocument();

    await usuario.click(genero("Drama"));
    expect(genero("Drama")).toHaveAttribute("aria-pressed", "true");
    expect(proximo).toBeEnabled();
  });

  it("trava os outros gêneros ao chegar em 5 e avisa o limite", async () => {
    const usuario = userEvent.setup();
    render(<OnboardingWizard />);

    for (const nome of ["Ação", "Drama", "Comédia", "Terror", "Thriller"]) {
      await usuario.click(genero(nome));
    }

    expect(genero("Romance")).toBeDisabled();
    expect(genero("Ação")).toBeEnabled();
    expect(screen.getByText("Você pode escolher até 5 gêneros.")).toBeInTheDocument();

    await usuario.click(genero("Ação"));
    expect(genero("Romance")).toBeEnabled();
  });

  it("Voltar mantém os gêneros escolhidos", async () => {
    const usuario = userEvent.setup();
    render(<OnboardingWizard />);

    await usuario.click(genero("Ação"));
    await usuario.click(genero("Drama"));
    await usuario.click(screen.getByRole("button", { name: "Próximo" }));

    expect(screen.getByText("Passo 2 de 3")).toBeInTheDocument();
    expect(screen.getByRole("radiogroup", { name: "Duração preferida" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Próximo" })).toBeDisabled();

    await usuario.click(screen.getByRole("button", { name: "Voltar" }));
    expect(screen.getByText("Passo 1 de 3")).toBeInTheDocument();
    expect(genero("Ação")).toHaveAttribute("aria-pressed", "true");
    expect(genero("Drama")).toHaveAttribute("aria-pressed", "true");
  });

  it("chega ao passo 3 com o botão Concluir", async () => {
    const usuario = userEvent.setup();
    render(<OnboardingWizard />);

    await usuario.click(genero("Ação"));
    await usuario.click(screen.getByRole("button", { name: "Próximo" }));
    await usuario.click(screen.getByRole("radio", { name: "Tanto faz" }));
    await usuario.click(screen.getByRole("button", { name: "Próximo" }));

    expect(screen.getByText("Passo 3 de 3")).toBeInTheDocument();
    const concluir = screen.getByRole("button", { name: "Concluir" });
    expect(concluir).toBeDisabled();
    await usuario.click(screen.getByRole("radio", { name: "Toda semana" }));
    expect(concluir).toBeEnabled();
  });
});
