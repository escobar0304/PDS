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
 */
export const CATEGORIAS_INICIAIS = [
  {
    name: 'Cristais em Bruto',
    slug: 'cristais-em-bruto',
    description: 'Cristais e pedras na sua forma natural e bruta, mantendo toda a energia original da terra.',
    image: '/images/confianca.png',
    order: 1
  },
  {
    name: 'Colares em Aço e Pedra',
    slug: 'colares-aco-pedra',
    description: 'Colares elegantes combinando aço inoxidável com pedras, perfeitos para o dia a dia.',
    image: '/images/confianca.png',
    order: 2
  },
  {
    name: 'Japamalas',
    slug: 'japamalas',
    description: 'Japamalas tradicionais com pedras naturais, ideais para meditação e práticas espirituais.',
    image: '/images/confianca.png',
    order: 3
  },
  {
    name: 'Pulseiras em Aço e Pedra',
    slug: 'pulseiras-aco-pedra',
    description: 'Pulseiras versáteis que combinam o brilho do aço com a energia das pedras naturais.',
    image: '/images/confianca.png',
    order: 4
  },
  {
    name: 'Anéis em Aço e Pedra',
    slug: 'aneis-aco-pedra',
    description: 'Anéis únicos que unem design contemporâneo com a beleza atemporal das pedras.',
    image: '/images/confianca.png',
    order: 5
  },
  {
    name: 'Decoração',
    slug: 'decoracao',
    description: 'Peças decorativas com cristais e pedras para embelezar o seu espaço.',
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
