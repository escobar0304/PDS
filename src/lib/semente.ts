import connectDB from '@/lib/db';
import { Category } from '@/lib/models';

/**
 * As categorias com que a loja comeca (`npm run seed`).
 *
 * **So cria as que faltam, pelo slug, e nao mexe nas que existem.** A versao
 * anterior apagava todas as categorias e voltava a inseri-las: com produtos
 * ja criados, cada produto ficava a apontar para uma categoria que deixou de
 * existir, e o painel nao tinha maneira de o reparar. Correr o seed devia
 * ser seguro a qualquer altura, e passa a ser.
 *
 * **As descricoes dizem o que a peca e, e nada sobre o que faz.** As que
 * vieram com o modelo inicial ("mantendo toda a energia original da terra",
 * "ideais para meditacao") eram afirmacoes escritas por um gerador, nao pelo
 * negocio (`afirmacoes.ts`). Quem gere a loja escreve as suas no painel; e
 * como uma categoria que existe nao e tocada, as dela ficam.
 */
export const CATEGORIAS_INICIAIS = [
  {
    name: 'Cristais em Bruto',
    slug: 'cristais-em-bruto',
    description: 'Cristais e pedras em bruto.',
    image: '/images/confianca.png',
    order: 1
  },
  {
    name: 'Colares em Aço e Pedra',
    slug: 'colares-aco-pedra',
    description: 'Colares em aço, com pedras.',
    image: '/images/confianca.png',
    order: 2
  },
  {
    name: 'Japamalas',
    slug: 'japamalas',
    description: 'Japamalas de contas de pedra.',
    image: '/images/confianca.png',
    order: 3
  },
  {
    name: 'Pulseiras em Aço e Pedra',
    slug: 'pulseiras-aco-pedra',
    description: 'Pulseiras em aço, com pedras.',
    image: '/images/confianca.png',
    order: 4
  },
  {
    name: 'Anéis em Aço e Pedra',
    slug: 'aneis-aco-pedra',
    description: 'Anéis em aço, com pedras.',
    image: '/images/confianca.png',
    order: 5
  },
  {
    name: 'Decoração',
    slug: 'decoracao',
    description: 'Peças de decoração com cristais e pedras.',
    image: '/images/confianca.png',
    order: 6
  }
] as const;

export async function semearCategorias(): Promise<{ criadas: string[]; jaExistiam: string[] }> {
  await connectDB();
  const criadas: string[] = [];
  const jaExistiam: string[] = [];
  for (const c of CATEGORIAS_INICIAIS) {
    const r = await Category.updateOne({ slug: c.slug }, { $setOnInsert: { ...c } }, { upsert: true });
    (r.upsertedCount > 0 ? criadas : jaExistiam).push(c.slug);
  }
  return { criadas, jaExistiam };
}
