import { z } from "zod";

export const MENSAGENS = {
  nome: "Informe um nome entre 2 e 50 caracteres.",
  email: "Informe um email válido.",
  senha: "A senha precisa ter ao menos 8 caracteres, com letras e números.",
  senhaLogin: "Informe sua senha.",
  confirmacao: "As senhas não conferem.",
} as const;

const email = z
  .string()
  .trim()
  .pipe(z.email({ error: MENSAGENS.email }));

export const loginSchema = z.object({
  email,
  senha: z.string().min(1, { error: MENSAGENS.senhaLogin }),
});

export const cadastroSchema = z
  .object({
    nome: z.string().trim().min(2, { error: MENSAGENS.nome }).max(50, { error: MENSAGENS.nome }),
    email,
    senha: z
      .string()
      .min(8, { error: MENSAGENS.senha })
      .regex(/\p{L}/u, { error: MENSAGENS.senha })
      .regex(/\d/, { error: MENSAGENS.senha }),
    confirmacao: z.string(),
  })
  .refine((dados) => dados.senha === dados.confirmacao, {
    error: MENSAGENS.confirmacao,
    path: ["confirmacao"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type CadastroInput = z.infer<typeof cadastroSchema>;
