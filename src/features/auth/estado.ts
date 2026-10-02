/** Estado devolvido pelas Server Actions de auth para `useActionState`. */
export type EstadoFormulario<Campo extends string> = {
  /** Erro por campo, já em pt-BR. */
  erros?: Partial<Record<Campo, string>>;
  /** Erro geral do formulário (ex.: credenciais inválidas). */
  mensagem?: string;
  /** Valores para reexibir no formulário; senhas nunca voltam. */
  valores?: Partial<Record<Campo, string>>;
};

export type CampoLogin = "email" | "senha";
export type CampoCadastro = "nome" | "email" | "senha" | "confirmacao";
