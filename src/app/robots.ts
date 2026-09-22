import type { MetadataRoute } from 'next';

/**
 * O site so pode ser indexado depois de ter a camada legal obrigatoria:
 * identificacao do prestador (DL 7/2004), livro de reclamacoes eletronico
 * (DL 156/2005), politica de privacidade (RGPD) e termos de venda. Ate la
 * bloqueamos os motores de busca, porque indexar afirmacoes comerciais por
 * validar sem essas paginas e exposicao real.
 *
 * Para levantar o bloqueio basta definir SITE_INDEXAVEL=true no ambiente de
 * producao, depois de F4 a F9 estarem publicadas.
 */
const indexavel = process.env.SITE_INDEXAVEL === 'true';

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://petalasdesonho.pt';

export default function robots(): MetadataRoute.Robots {
  if (!indexavel) {
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/area-pessoal/', '/auth/', '/carrinho', '/sucesso', '/falha'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
