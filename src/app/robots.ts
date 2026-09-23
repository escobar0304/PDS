import type { MetadataRoute } from 'next';
import { identificacaoCompleta } from '@/lib/empresa';
import { paginasObrigatoriasProntas } from '@/lib/paginas';

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
/**
 * Indexar exige tres coisas ao mesmo tempo: a intencao (a variavel de
 * ambiente), os dados obrigatorios do prestador preenchidos, e as paginas
 * legais obrigatorias a existirem. As duas ultimas nao se esquecem nem se
 * ligam por engano — sem denominacao, NIF, morada, contactos, entidade de
 * resolucao de litigios, termos e condicoes de envio, o site continua
 * bloqueado mesmo com a variavel a true.
 */
const indexavel =
  process.env.SITE_INDEXAVEL === 'true' &&
  identificacaoCompleta() &&
  paginasObrigatoriasProntas();

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
