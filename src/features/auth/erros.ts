const MENSAGEM_GENERICA = "Não foi possível concluir agora. Tente de novo.";
const MUITAS_TENTATIVAS = "Muitas tentativas. Aguarde um pouco e tente de novo.";
const EMAIL_CADASTRADO = "Este email já está cadastrado.";

const MENSAGENS_POR_CODIGO: Record<string, string> = {
  invalid_credentials: "Email ou senha incorretos.",
  user_already_exists: EMAIL_CADASTRADO,
  email_exists: EMAIL_CADASTRADO,
  weak_password: "A senha precisa ter ao menos 8 caracteres, com letras e números.",
  over_request_rate_limit: MUITAS_TENTATIVAS,
  over_email_send_rate_limit: MUITAS_TENTATIVAS,
};

/** Converte o código de erro do Supabase Auth numa mensagem para o usuário. */
export function traduzirErroAuth(codigo: string | undefined): string {
  return (codigo && MENSAGENS_POR_CODIGO[codigo]) || MENSAGEM_GENERICA;
}
