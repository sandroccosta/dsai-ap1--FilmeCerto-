import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CadastroForm } from "@/features/auth/components/cadastro-form";
import { MENSAGENS } from "@/features/auth/schema";

const cadastrar = vi.hoisted(() => vi.fn());
vi.mock("@/features/auth/actions", () => ({ cadastrar, entrar: vi.fn() }));

async function preencher(dados: Partial<Record<string, string>>) {
  const usuario = userEvent.setup();
  const campos = {
    Nome: dados.nome ?? "Ana Souza",
    Email: dados.email ?? "ana@example.com",
    Senha: dados.senha ?? "filme1234",
    "Confirme a senha": dados.confirmacao ?? dados.senha ?? "filme1234",
  };
  for (const [rotulo, valor] of Object.entries(campos)) {
    await usuario.type(screen.getByLabelText(rotulo), valor);
  }
  await usuario.click(screen.getByRole("button", { name: "Criar conta" }));
}

describe("CadastroForm", () => {
  it("mostra o erro do campo e marca o campo como inválido, sem chamar o servidor", async () => {
    render(<CadastroForm />);
    await preencher({ nome: "A" });

    const nome = screen.getByLabelText("Nome");
    expect(await screen.findByText(MENSAGENS.nome)).toBeInTheDocument();
    expect(nome).toHaveAttribute("aria-invalid", "true");
    expect(nome).toHaveAccessibleDescription(MENSAGENS.nome);
    expect(cadastrar).not.toHaveBeenCalled();
  });

  it("aponta confirmação diferente da senha", async () => {
    render(<CadastroForm />);
    await preencher({ senha: "filme1234", confirmacao: "outra1234" });

    expect(await screen.findByText(MENSAGENS.confirmacao)).toBeInTheDocument();
    expect(screen.getByLabelText("Confirme a senha")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Senha")).not.toHaveAttribute("aria-invalid");
  });

  it("mostra a mensagem geral devolvida pelo servidor", async () => {
    cadastrar.mockResolvedValueOnce({
      mensagem: "Este email já está cadastrado.",
      valores: { nome: "Ana Souza", email: "ana@example.com" },
    });
    render(<CadastroForm />);
    await preencher({});

    expect(await screen.findByRole("alert")).toHaveTextContent("Este email já está cadastrado.");
    expect(cadastrar).toHaveBeenCalledOnce();
  });
});
