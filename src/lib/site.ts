import { paginasDisponiveis } from '@/lib/paginas';

/**
 * O endereco do sitio, e o que nele e publico.
 *
 * Fonte unica. Estava escrito em tres sitios, com `https://petalasdesonho.pt`
 * por omissao — **um dominio que ninguem confirmou ser o do negocio.** Em
 * producao, `NEXT_PUBLIC_SITE_URL` tem de estar definido: o mapa do sitio e
 * os enderecos canonicos dizem aos motores de busca qual e o endereco
 * verdadeiro de cada pagina, e com o dominio errado dizem-lhes o de outra
 * pessoa.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://petalasdesonho.pt';

/**
 * O que os motores de busca nao devem ver: contas, carrinho, administracao e
 * API. O `robots.ts` bloqueia-as e o `sitemap.ts` nunca
 * as lista — as duas listas nao podem discordar, por isso sao a mesma.
 */
export const ROTAS_PRIVADAS = [
  '/api/',
  '/admin',
  '/area-pessoal',
  '/auth/',
  '/carrinho',
] as const;

export function privada(caminho: string): boolean {
  return ROTAS_PRIVADAS.some((r) => caminho === r.replace(/\/$/, '') || caminho.startsWith(r));
}

/** As paginas publicas que o mapa do sitio lista, alem dos produtos. */
const PRINCIPAIS = ['/', '/loja', '/catalogo', '/sobre-nos'];

export function paginasDoMapa(): string[] {
  const institucionais = paginasDisponiveis()
    .map((p) => p.href)
    .filter((h) => h.startsWith('/'));
  return [...new Set([...PRINCIPAIS, ...institucionais])].filter((c) => !privada(c));
}
