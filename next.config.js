/**
 * Cabecalhos de seguranca.
 *
 * A CSP e a unica destas que e capaz de partir o site, por isso esta escrita
 * a partir do que o site faz hoje e nao de um modelo:
 *
 * - `frame-src` permite a Google por causa do mapa em Sobre Nos, que so
 *   carrega a pedido. E a unica origem de terceiro no sitio inteiro
 * - `img-src` permite `data:` por causa do icone do <select>, que e um SVG
 *   embutido, e `blob:` para o optimizador de imagens do Next
 * - `'unsafe-inline'` em `style-src` e exigido pelo Next, que injecta estilos
 *   em linha. Nao ha forma de o evitar sem nonces por pedido, que obrigariam
 *   a tornar todas as paginas dinamicas
 * - `script-src` leva `'unsafe-inline'` porque o Next injecta os dados de
 *   hidratacao assim. Fica registado como divida: com `middleware` e nonce
 *   por pedido, sai
 * - `'unsafe-eval'` so em desenvolvimento. Esteve em producao sem nenhuma
 *   razao escrita; o Next so precisa de `eval` para o recarregamento a
 *   quente. Medido sem ele no servidor de producao: nenhuma violacao da CSP
 *   em seis paginas, e a suite de ponta a ponta verde. E a directiva que
 *   transforma uma injeccao de texto em execucao de codigo — nao se deixa
 *   ligada por omissao
 *
 * Os pagamentos nao mudam nada aqui: a pessoa paga na pagina da Stripe, e o
 * `stripe.js` nunca carrega neste sitio (ROADMAP-V2, E4). O checkout so
 * fala com o proprio sitio (`connect-src 'self'`) e depois muda de pagina
 * para a da Stripe, o que a CSP nao restringe.
 */
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-src https://www.google.com",
  'upgrade-insecure-requests',
].join('; ');

const cabecalhos = [
  { key: 'Content-Security-Policy', value: csp },
  // Impede o browser de adivinhar o tipo de um ficheiro a partir do conteudo,
  // que e como um upload de texto se transforma em script executavel.
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // `frame-ancestors` acima ja cobre isto nos browsers modernos; fica para os
  // que ainda nao leem CSP.
  { key: 'X-Frame-Options', value: 'DENY' },
  // So o dominio sai no referer para fora; dentro do sitio vai o caminho todo.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Nada nesta aplicacao precisa de camara, microfone ou localizacao.
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  // Dois anos, com subdominios. Nao se inclui `preload` de proposito: entrar
  // na lista de pre-carregamento e dificil de reverter e e uma decisao a
  // tomar com o dominio ja estavel.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
];

/** @type {import('next').NextConfig} */
module.exports = {
  images: {
    /**
     * 82 e nao 90.
     *
     * Medido no hero: q=90 da 124 kB, q=82 da 74 kB, e a 100% numa face de
     * cristal nao se distinguem — PSNR de 42,4 dB contra q=95, acima do
     * limiar de impercetibilidade. Abaixo disto ja se perde textura mineral,
     * e numa loja de pedras a textura e o produto.
     */
    qualities: [82],
  },
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: cabecalhos }];
  },
};
