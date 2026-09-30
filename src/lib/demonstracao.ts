import connectDB from '@/lib/db';
import { criarProduto } from '@/lib/gestao';
import { Category, Product } from '@/lib/models';
import { esquemaNovoProduto } from '@/lib/validacao';

/**
 * Pecas de exemplo, para mostrar o sitio a funcionar antes de haver pecas
 * reais.
 *
 * **Nao sao dados do negocio, e dizem-no.** Cada nome comeca por "Exemplo",
 * cada descricao diz que nada ali e de uma peca real, e so entram numa loja
 * em ensaio (`LOJA_ENSAIO=1`), que ja mostra em cada pagina de pedido que e
 * um ensaio. As fotografias sao as do proprio sitio.
 *
 * Entram pela mesma validacao e pela mesma funcao que o painel usa
 * (`esquemaNovoProduto`, `criarProduto`): se o painel as recusasse, isto
 * tambem as recusa. Correr duas vezes nao duplica nada.
 */

export const PREFIXO_EXEMPLO = 'Exemplo · ';

const DESCRICAO =
  'Peça de exemplo, para demonstração: o nome, o preço, o peso e a fotografia não são de uma peça real.';

/**
 * As categorias de que as pecas precisam. So se criam se faltarem; se ja
 * existirem (do `seed`, ou do painel), ficam como estao, e as pecas
 * adaptam-se a elas (ver `variantes`).
 */
const CATEGORIAS = [
  { slug: 'cristais-em-bruto', name: 'Cristais em Bruto', order: 1, pecasUnicas: true },
  { slug: 'colares-aco-pedra', name: 'Colares em Aço e Pedra', order: 2, pecasUnicas: false },
  { slug: 'decoracao', name: 'Decoração', order: 6, pecasUnicas: true },
] as const;

type Categoria = (typeof CATEGORIAS)[number]['slug'];

export const PECAS_DE_EXEMPLO: ReadonlyArray<{
  nome: string;
  slug: string;
  categoria: Categoria;
  precoCents: number;
  pesoGramas: number;
  /** Numa categoria de pecas unicas, e sempre 1. */
  stock: number;
  /** Numa categoria com medidas, cada medida tem nome (`catalogo.ts`). */
  medida: string;
  imagem: string;
  destaque: boolean;
}> = [
  { nome: 'Ponta de ametista', slug: 'exemplo-ponta-de-ametista', categoria: 'cristais-em-bruto', precoCents: 3800, pesoGramas: 180, stock: 1, medida: 'Tamanho único', imagem: '/images/pedras-especiais.png', destaque: true },
  { nome: 'Quartzo rosa em bruto', slug: 'exemplo-quartzo-rosa', categoria: 'cristais-em-bruto', precoCents: 1500, pesoGramas: 250, stock: 1, medida: 'Tamanho único', imagem: '/images/pedras-especiais.png', destaque: false },
  { nome: 'Colar de ametista', slug: 'exemplo-colar-de-ametista', categoria: 'colares-aco-pedra', precoCents: 2900, pesoGramas: 40, stock: 2, medida: '45 cm', imagem: '/images/confianca.png', destaque: true },
  { nome: 'Colar de quartzo', slug: 'exemplo-colar-de-quartzo', categoria: 'colares-aco-pedra', precoCents: 2400, pesoGramas: 35, stock: 4, medida: '45 cm', imagem: '/images/confianca.png', destaque: false },
  { nome: 'Drusa para decoração', slug: 'exemplo-drusa-decoracao', categoria: 'decoracao', precoCents: 6500, pesoGramas: 1400, stock: 1, medida: 'Tamanho único', imagem: '/images/pedras-especiais.png', destaque: true },
];

/**
 * As medidas conforme a categoria: uma peca unica nao tem medida e tem uma
 * so unidade; num modelo com medidas, cada uma tem nome.
 */
export function variantes(
  p: (typeof PECAS_DE_EXEMPLO)[number],
  pecasUnicas: boolean
): Array<{ medida?: string; stock: number }> {
  return pecasUnicas ? [{ stock: Math.min(p.stock, 1) }] : [{ medida: p.medida, stock: p.stock }];
}

export type ResultadoDemonstracao =
  | { ok: true; criadas: number; jaExistiam: number }
  | { ok: false; porque: string };

export async function criarPecasDeExemplo(
  env: Record<string, string | undefined> = process.env
): Promise<ResultadoDemonstracao> {
  if (env.LOJA_ENSAIO !== '1') {
    return { ok: false, porque: 'As peças de exemplo só entram numa loja em ensaio (LOJA_ENSAIO=1).' };
  }

  await connectDB();

  const categorias = new Map<Categoria, { id: string; pecasUnicas: boolean }>();
  for (const c of CATEGORIAS) {
    const doc = await Category.findOneAndUpdate(
      { slug: c.slug },
      { $setOnInsert: { name: c.name, slug: c.slug, order: c.order, pecasUnicas: c.pecasUnicas } },
      { upsert: true, new: true }
    ).lean();
    categorias.set(c.slug, { id: String(doc!._id), pecasUnicas: Boolean(doc!.pecasUnicas) });
  }

  let criadas = 0;
  let jaExistiam = 0;
  for (const p of PECAS_DE_EXEMPLO) {
    if (await Product.exists({ slug: p.slug })) {
      jaExistiam += 1;
      continue;
    }
    const dados = esquemaNovoProduto.parse({
      name: PREFIXO_EXEMPLO + p.nome,
      slug: p.slug,
      description: DESCRICAO,
      priceCents: p.precoCents,
      weightGrams: p.pesoGramas,
      categoryId: categorias.get(p.categoria)!.id,
      images: [p.imagem],
      featured: p.destaque,
      active: true,
      variantes: variantes(p, categorias.get(p.categoria)!.pecasUnicas),
    });
    const r = await criarProduto(dados, 'demonstracao');
    if (!r.ok) return { ok: false, porque: `${p.slug}: ${r.erro}` };
    criadas += 1;
  }

  return { ok: true, criadas, jaExistiam };
}
