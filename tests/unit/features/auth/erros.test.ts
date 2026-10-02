import { describe, expect, it } from "vitest";

import { traduzirErroAuth } from "@/features/auth/erros";

describe("traduzirErroAuth", () => {
  it.each([
    ["invalid_credentials", "Email ou senha incorretos."],
    ["user_already_exists", "Este email já está cadastrado."],
    ["email_exists", "Este email já está cadastrado."],
    ["weak_password", "A senha precisa ter ao menos 8 caracteres, com letras e números."],
    ["over_request_rate_limit", "Muitas tentativas. Aguarde um pouco e tente de novo."],
    ["over_email_send_rate_limit", "Muitas tentativas. Aguarde um pouco e tente de novo."],
  ])("traduz %s", (codigo, mensagem) => {
    expect(traduzirErroAuth(codigo)).toBe(mensagem);
  });

  it.each(["unexpected_failure", "", undefined])("usa a mensagem genérica para %j", (codigo) => {
    expect(traduzirErroAuth(codigo)).toBe("Não foi possível concluir agora. Tente de novo.");
  });
});
