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

/**
 * O que a propria pessoa pode mudar no perfil: o nome, e so o nome.
 *
 * `strict()` e o que isto tem de importante. Sem ele, o zod descarta em
 * silencio os campos que nao conhece — o que ja chegava, porque a rota so
 * escreve `name`. Com ele, um pedido com `role`, `email` ou `emailVerified`
 * e **recusado**, em vez de aceite a meio. Uma rota de perfil que passe o
 * corpo inteiro para a base de dados e o caminho classico para alguem se
 * promover a ADMIN; recusar o que nao se pediu torna isso visivel a quem
 * experimente, em vez de parecer que funcionou.
 */
export const esquemaPerfil = z.object({ name: texto(120) }).strict();

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

/**
 * O que o cliente pode dizer sobre uma encomenda: que produtos, e quantos.
 * Nunca o preco — ver `lib/encomenda.ts`. `strict()` recusa um `priceCents`
 * enviado junto, em vez de o ignorar, para quem experimente ver que nao
 * funcionou.
 */
export const esquemaPedido = z
  .array(
    z
      .object({
        id: z.string().regex(/^[a-f0-9]{24}$/i, 'Identificador inválido'),
        varianteId: z.string().regex(/^[a-f0-9]{24}$/i, 'Identificador inválido').optional(),
        quantidade: z.number().int().min(1).max(99),
      })
      .strict()
  )
  .min(1)
  .max(50);

// ============================================
// ADMINISTRACAO (ROADMAP-V2, C3)
// ============================================
//
// Tudo `strict()`: um campo que o painel nao manda e recusado, e nao
// ignorado. O `stock` nao esta em nenhum destes esquemas de proposito — muda
// por movimentos (`esquemaMovimento`), nunca por valor.

const idMongo = z.string().regex(/^[a-f0-9]{24}$/i, 'Identificador inválido');

/**
 * Imagens so do proprio sitio, enquanto nao houver alojamento de imagens
 * decidido. Um URL de fora e um terceiro contactado por cada visita (ver
 * `e2e/privacidade.spec.ts`), e o `next/image` nao o serve.
 */
const imagem = z
  .string()
  .trim()
  .max(300)
  .regex(/^\/images\/[a-z0-9][a-z0-9/_-]*\.(?:webp|png|jpe?g|avif)$/i, 'Imagem inválida');

const propriedades = z
  .object({
    chakra: z.string().trim().max(80).optional(),
    elemento: z.string().trim().max(80).optional(),
    signo: z.string().trim().max(80).optional(),
    beneficios: z.array(z.string().trim().min(1).max(200)).max(10).optional(),
    cuidados: z.array(z.string().trim().min(1).max(200)).max(10).optional(),
  })
  .strict();

const camposProduto = {
  name: texto(120),
  slug,
  description: z.string().trim().max(2000).optional(),
  priceCents: z.number().int().min(0).max(10_000_000),
  weightGrams: z.number().int().min(1).max(100_000),
  categoryId: idMongo,
  images: z.array(imagem).max(12),
  featured: z.boolean(),
  active: z.boolean(),
  dimensions: z.string().trim().max(120).optional(),
  properties: propriedades.optional(),
};

/** Criar: as medidas com o stock inicial, que entra como movimento "entrada". */
export const esquemaNovoProduto = z
  .object({
    ...camposProduto,
    variantes: z
      .array(
        z
          .object({
            medida: z.string().trim().max(40).optional(),
            stock: z.number().int().min(0).max(100_000),
          })
          .strict()
      )
      .min(1)
      .max(40),
  })
  .strict();

/**
 * Editar: so o que se muda por valor. Medidas novas acrescentam-se com stock
 * 0; as que existem podem mudar de nome, nunca desaparecer — uma encomenda
 * aponta para elas.
 */
export const esquemaEdicaoProduto = z
  .object({
    ...camposProduto,
    variantes: z
      .array(
        z
          .object({
            _id: idMongo.optional(),
            medida: z.string().trim().max(40).optional(),
          })
          .strict()
      )
      .min(1)
      .max(40),
  })
  .partial()
  .strict();

/** O que se pode fazer ao stock pelo painel. As reservas sao do sistema. */
export const MOTIVOS_PAINEL = ['venda-loja', 'entrada', 'acerto', 'quebra'] as const;

export const esquemaMovimento = z
  .object({
    varianteId: idMongo,
    delta: z
      .number()
      .int()
      .min(-100_000)
      .max(100_000)
      .refine((v) => v !== 0, 'Um movimento não pode ser zero'),
    motivo: z.enum(MOTIVOS_PAINEL),
    nota: z.string().trim().max(500).optional(),
  })
  .strict()
  // Vender e partir so tiram; so a entrada so acrescenta. O acerto vai para
  // os dois lados: e para quando a contagem na prateleira nao bate certo.
  .refine(
    (m) =>
      (m.motivo !== 'venda-loja' && m.motivo !== 'quebra') || m.delta < 0,
    'Uma venda ou uma quebra tiram stock'
  )
  .refine((m) => m.motivo !== 'entrada' || m.delta > 0, 'Uma entrada acrescenta stock');

export const esquemaNovaCategoria = z
  .object({
    name: texto(80),
    slug,
    description: z.string().trim().max(500).optional(),
    image: imagem.optional(),
    order: z.number().int().min(0).max(9999).optional(),
    // Obrigatorio, e sem valor por omissao: e uma decisao do negocio sobre a
    // categoria, e o painel tem de a pedir.
    pecasUnicas: z.boolean(),
  })
  .strict();

export const esquemaEdicaoCategoria = z
  .object({
    name: texto(80),
    slug,
    description: z.string().trim().max(500).optional(),
    image: imagem.optional(),
    order: z.number().int().min(0).max(9999),
    pecasUnicas: z.boolean(),
  })
  .partial()
  .strict();
