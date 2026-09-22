import { z } from 'zod';

/**
 * Validacao do corpo dos pedidos.
 *
 * O problema que resolve nao e "campo em falta" — isso ja era verificado com
 * um `if`. E o tipo.
 *
 * Um parametro de URL chega sempre como texto. O corpo em JSON nao: aceita
 * objectos. `{"email": {"$ne": null}}` passa num `if (!email)` sem problema,
 * e depois `User.findOne({ email })` deixa de procurar um endereco e passa a
 * procurar qualquer utilizador. E injeccao NoSQL, e e por isso que a
 * validacao tem de ser de esquema e nao de presenca.
 */

/** Rejeita tudo o que nao seja mesmo uma cadeia de texto. */
const texto = (max: number) => z.string().trim().min(1).max(max);

export const esquemaContacto = z.object({
  name: texto(120),
  email: z.string().trim().toLowerCase().email().max(254),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  subject: texto(120),
  message: texto(5000),
});

export type DadosContacto = z.infer<typeof esquemaContacto>;

export const esquemaRegisto = z.object({
  name: texto(120),
  email: z.string().trim().toLowerCase().email().max(254),
  // O minimo de 6 vem do userSchema. Curto, mas mudar isto agora invalidava
  // as contas existentes; fica para o endurecimento de autenticacao.
  password: z.string().min(6).max(200),
});

export type DadosRegisto = z.infer<typeof esquemaRegisto>;

export const esquemaCredenciais = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(200),
});

/**
 * Le e valida o corpo de um pedido.
 *
 * Devolve um resultado em vez de lancar, para a rota decidir o que responder.
 * JSON malformado conta como dados invalidos, nao como erro do servidor: quem
 * enviou e que errou.
 */
export async function lerCorpo<T extends z.ZodTypeAny>(
  pedido: Request,
  esquema: T,
): Promise<
  { ok: true; dados: z.infer<T> } | { ok: false; erro: string }
> {
  let bruto: unknown;
  try {
    bruto = await pedido.json();
  } catch {
    return { ok: false, erro: 'Corpo do pedido inválido.' };
  }

  const r = esquema.safeParse(bruto);
  if (!r.success) {
    // A mensagem devolvida nao inclui o detalhe do erro de propósito: dizer
    // ao cliente exactamente que regra falhou ajuda tanto quem preenche mal
    // como quem esta a sondar a API.
    return { ok: false, erro: 'Dados inválidos.' };
  }

  return { ok: true, dados: r.data };
}

/** Identificador legivel em URL: so minusculas, digitos e hifens. */
const slug = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug inválido');

export const esquemaCategoria = z.object({
  name: texto(80),
  slug,
  description: z.string().trim().max(500).optional().or(z.literal('')),
  image: z.string().trim().max(500).optional().or(z.literal('')),
  order: z.number().int().min(0).max(9999).optional(),
});

export const esquemaPedidoReposicao = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
});

export const esquemaNovaPassword = z.object({
  token: z.string().trim().min(20).max(200),
  password: z.string().min(8).max(200),
});

export const esquemaVerificacao = z.object({
  token: z.string().trim().min(20).max(200),
});
