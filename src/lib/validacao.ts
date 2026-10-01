import { z } from 'zod';
import { ASSUNTOS_CONTACTO, type AssuntoContacto } from '@/lib/contacto';

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
  // Algarismos, espacos, e os sinais de um numero escrito a mao: `+351 912
  // 345 678`, `(22) 123-4567`. Nada que seja texto livre a entrar no email.
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s().-]{9,20}$/)
    .optional()
    .or(z.literal('')),
  subject: z.enum(Object.keys(ASSUNTOS_CONTACTO) as [AssuntoContacto, ...AssuntoContacto[]]),
  message: texto(5000),
  // A armadilha para programas: um campo que as pessoas nao veem nem
  // alcancam com o teclado. Quem o preenche nao e uma pessoa. Ver a rota.
  sitio: z.string().max(200).optional(),
});

export type DadosContacto = z.infer<typeof esquemaContacto>;

export const esquemaRegisto = z.object({
  name: texto(120),
  email: z.string().trim().toLowerCase().email().max(254),
  // 8, como a reposicao (`esquemaNovaPassword`) e o minimo da NIST SP 800-63B.
  // Estava a 6 com a razao de que subir invalidava as contas existentes; nao
  // invalidava: a entrada valida com `esquemaCredenciais`, que nao tem minimo.
  password: z.string().min(8).max(200),
  // So maiores de 18 criam conta: decisao do negocio, a 30/09/2026. E uma
  // declaracao, e nao uma data de nascimento: a data e um dado pessoal a mais
  // (RGPD, art. 5.º, n.º 1, al. c)) que nao prova nada que a declaracao nao
  // prove, e verificar a serio pedia um documento de identificacao. `true` e
  // so `true`: nem `"true"`, nem `1`, nem ausente.
  maiorDeIdade: z.literal(true),
});

/** A mesma declaracao, para quem entrou pela Google e ainda nao a fez. */
export const esquemaMaioridade = z.object({ maiorDeIdade: esquemaRegisto.shape.maiorDeIdade }).strict();

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
  // So JSON declarado como JSON. Um formulario HTML de outro sitio consegue
  // enviar um corpo que se le como JSON (`enctype="text/plain"`), mas nao
  // consegue declarar `application/json` sem o browser pedir autorizacao
  // primeiro (CORS), e essa autorizacao este sitio nunca da. Os cookies da
  // sessao sao `SameSite=Lax` e ja nao iam num pedido desses; isto fecha a
  // porta tambem para o que nao depende de sessao, como o contacto.
  const tipo = pedido.headers.get('content-type') ?? '';
  if (!/^application\/json\b/i.test(tipo)) {
    return { ok: false, erro: 'Corpo do pedido inválido.' };
  }

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
 * Imagens so do proprio sitio. Um URL de fora e um terceiro contactado por
 * cada visita (ver `e2e/privacidade.spec.ts`), e o `next/image` nao o serve.
 * Ou estao no repositorio (`/images/...`), ou foram carregadas pelo painel e
 * tem o nome que `lib/imagens.ts` lhes da (`/imagens/<resumo>.webp`).
 */
const imagem = z
  .string()
  .trim()
  .max(300)
  .regex(
    /^(?:\/images\/[a-z0-9][a-z0-9/_-]*\.(?:webp|png|jpe?g|avif)|\/imagens\/[a-f0-9]{64}\.webp)$/i,
    'Imagem inválida'
  );

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

// ============================================
// CHECKOUT (ROADMAP-V2, E5)
// ============================================

/**
 * O codigo postal, so do continente. Os da Madeira comecam por 9 (9000 a
 * 9399), e os dos Acores tambem (9500 a 9999): envia-se so para o continente
 * (`CONDICOES.zonaEnvio`), e um portes calculado para o continente e cobrado
 * para as ilhas seria um preco errado.
 */
export const codigoPostalContinente = z
  .string()
  .trim()
  .regex(/^[1-8]\d{3}-\d{3}$/, 'Código postal do continente, como 4000-123');

/**
 * O telefone, para os CTT avisarem da entrega. Um portugues (fixo ou movel,
 * com ou sem +351) ou um estrangeiro com o indicativo. Espacos e hifenes
 * saem antes de verificar, e o que fica guardado ja vem sem eles.
 */
export const telefone = z
  .string()
  .transform((t) => t.replace(/[\s-]/g, ''))
  .pipe(z.string().regex(/^(?:(?:\+351)?[29]\d{8}|\+(?!351)\d{8,15})$/, 'Telefone inválido'));

/**
 * Quem compra, e para onde. So o que a entrega precisa: sem conta, sem
 * palavra-passe, sem data de nascimento (ROADMAP-V2, E5, sobre minimizacao).
 *
 * **O mesmo esquema corre no browser e no servidor.** No browser, so para
 * dizer campo a campo o que falta; e o do servidor que conta, porque o do
 * browser muda-o quem quiser.
 */
export const esquemaCliente = z
  .object({
    nome: texto(120),
    email: z.string().trim().toLowerCase().email().max(254),
    telefone,
    morada: texto(200),
    codigoPostal: codigoPostalContinente,
    localidade: texto(80),
  })
  .strict();

export type DadosDoCliente = z.infer<typeof esquemaCliente>;

/** Pedir o total, com portes, antes de encomendar. */
export const esquemaOrcamento = z.object({ linhas: esquemaPedido }).strict();

/**
 * Encomendar.
 *
 * `totalVistoCents` **nao e um preco que o servidor use** — nunca entra em
 * conta nenhuma. E o total que a pessoa viu imediatamente antes do botao, que
 * a lei obriga a mostrar (DL 24/2014, art. 4.º): se o calculo do servidor der
 * outro valor (um preco mudou entretanto), a encomenda e recusada e a pessoa
 * ve o novo, em vez de pagar um total que nao lhe foi mostrado.
 *
 * A entrega e so por envio: o levantamento na loja esta por decidir
 * (`CONDICOES.levantamentoNaLoja`), e aceita-lo agora era prometer um servico
 * que ninguem confirmou.
 */
export const esquemaCheckout = z
  .object({
    linhas: esquemaPedido,
    cliente: esquemaCliente,
    entrega: z.literal('SHIPPING'),
    totalVistoCents: z.number().int().min(0).max(100_000_000),
  })
  .strict();

/** Desistir de uma encomenda por pagar, com a chave que so quem a fez tem. */
export const esquemaDesistencia = z
  .object({ chave: z.string().regex(/^[A-Za-z0-9_-]{43}$/, 'Chave inválida') })
  .strict();

/**
 * O que o painel faz a uma encomenda (ROADMAP-V2, P3). O numero de
 * seguimento dos CTT vai em maiusculas e sem espacos, como vem na etiqueta
 * (ex.: RR123456789PT); nao se restringe mais do que isso, porque os
 * servicos dos CTT nao tem todos o mesmo formato.
 */
export const esquemaAcaoEncomenda = z.discriminatedUnion('acao', [
  z
    .object({
      acao: z.literal('expedir'),
      seguimento: z
        .string()
        .transform((s) => s.replace(/\s+/g, '').toUpperCase())
        .pipe(z.string().regex(/^[A-Z0-9]{8,30}$/, 'Número de seguimento inválido')),
    })
    .strict(),
  z.object({ acao: z.literal('concluir') }).strict(),
  z.object({ acao: z.literal('reembolsar'), nota: z.string().trim().max(500).optional() }).strict(),
  z.object({ acao: z.literal('reenviar-aviso') }).strict(),
]);
