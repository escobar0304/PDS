import type { SVGProps } from 'react';

/**
 * A marca, em vetor.
 *
 * Ate a F1 o logotipo era um "SVG" de 636 kB: tres <rect> preenchidos com
 * PNG em base64, carregados no cabecalho de todas as paginas. Isto e o
 * desenho refeito como geometria a serio — as mesmas tres pontas de quartzo
 * rosa a sair de duas petalas, mas facetadas, com a luz toda do mesmo lado,
 * e nitidas a qualquer tamanho.
 *
 * As cores sao as medidas no logotipo original, nao tokens: a marca tem de
 * se manter igual mesmo que a paleta do site mude.
 */

/**
 * `titulo: null` marca a peca como decorativa. Tem de ser null e nao
 * undefined: um parametro com valor por omissao em JavaScript trata
 * undefined como "nao passado" e volta a por a etiqueta, o que faz a marca
 * ser anunciada duas vezes quando esta dentro do logotipo completo.
 */
type Props = SVGProps<SVGSVGElement> & { titulo?: string | null };

function acessivel(titulo: string | null | undefined) {
  return titulo
    ? { role: 'img' as const, 'aria-label': titulo }
    : { 'aria-hidden': true };
}

/** Marca completa: tres cristais e duas petalas. Use acima de 32 px. */
export function Simbolo({ titulo = 'Pétalas de Sonho', ...resto }: Props) {
  return (
    <svg viewBox="0 0 120 176" {...acessivel(titulo)} {...resto}>
      <g transform="rotate(-15 41 154)">
    <path d="M24 83.78L35.22 78L35.22 154L24 154Z" fill="#f0909f"/>
    <path d="M35.22 78L46.78 78L46.78 154L35.22 154Z" fill="#ffb4c0"/>
    <path d="M46.78 78L58 83.78L58 154L46.78 154Z" fill="#ffc9d2"/>
    <path d="M24 83.78L35.22 78L41.0 34Z" fill="#f0909f"/>
    <path d="M35.22 78L46.78 78L41.0 34Z" fill="#ffc9d2"/>
    <path d="M46.78 78L58 83.78L41.0 34Z" fill="#ffe1e6"/>
  </g>
  <g transform="rotate(13 81 154)">
    <path d="M67 100.76L76.24 96L76.24 154L67 154Z" fill="#f0909f"/>
    <path d="M76.24 96L85.76 96L85.76 154L76.24 154Z" fill="#ffb4c0"/>
    <path d="M85.76 96L95 100.76L95 154L85.76 154Z" fill="#ffc9d2"/>
    <path d="M67 100.76L76.24 96L81.0 62Z" fill="#f0909f"/>
    <path d="M76.24 96L85.76 96L81.0 62Z" fill="#ffc9d2"/>
    <path d="M85.76 96L95 100.76L81.0 62Z" fill="#ffe1e6"/>
  </g>
  <g>
    <path d="M41 62.46L53.54 56L53.54 154L41 154Z" fill="#f0909f"/>
    <path d="M53.54 56L66.46000000000001 56L66.46000000000001 154L53.54 154Z" fill="#ffb4c0"/>
    <path d="M66.46000000000001 56L79 62.46L79 154L66.46000000000001 154Z" fill="#ffc9d2"/>
    <path d="M41 62.46L53.54 56L60.0 10Z" fill="#f0909f"/>
    <path d="M53.54 56L66.46000000000001 56L60.0 10Z" fill="#ffc9d2"/>
    <path d="M66.46000000000001 56L79 62.46L60.0 10Z" fill="#ffe1e6"/>
  </g>
  <path d="M62 116C42 116 12 138 14 168C22 178 58 152 62 116Z" fill="#e5697f"/>
  <path d="M58 116C80 112 108 130 104 160C96 174 62 150 58 116Z" fill="#f7889b"/>
    </svg>
  );
}

/**
 * Marca compacta: um cristal e duas petalas.
 *
 * Abaixo de uns 32 px os tres cristais viram uma mancha. Isto e a mesma
 * ideia com menos informacao, nao outro desenho.
 */
export function SimboloCompacto({ titulo, ...resto }: Props) {
  return (
    <svg viewBox="0 0 120 176" {...acessivel(titulo)} {...resto}>
      <path d="M30 72.2L49.8 62L49.8 150L30 150Z" fill="#f0909f"/>
  <path d="M49.8 62L70.2 62L70.2 150L49.8 150Z" fill="#ffb4c0"/>
  <path d="M70.2 62L90 72.2L90 150L70.2 150Z" fill="#ffc9d2"/>
  <path d="M30 72.2L49.8 62L60.0 12Z" fill="#f0909f"/>
  <path d="M49.8 62L70.2 62L60.0 12Z" fill="#ffc9d2"/>
  <path d="M70.2 62L90 72.2L60.0 12Z" fill="#ffe1e6"/>
  <path d="M64 120C40 122 10 138 12 164C24 178 58 150 64 120Z" fill="#e5697f"/>
  <path d="M56 120C82 118 112 132 108 158C98 176 62 148 56 120Z" fill="#f7889b"/>
    </svg>
  );
}

/**
 * O lettering, herdado do logotipo original.
 *
 * Vem de um vetor tracado sobre a unica fonte que existe — um raster de
 * 1536x1024 — porque nao ha ficheiro vetorial original e as letras sao a
 * marca.
 *
 * Nao e JSX de proposito. O tracado tem 26 kB de coordenadas; embutido no
 * componente ia parar ao bundle de JavaScript de todas as paginas. Como
 * mascara CSS e um ficheiro estatico, servido e cacheado uma vez, e a cor
 * continua a ser nossa: o fundo do elemento e que pinta o desenho, por isso
 * `currentColor` funciona na mesma.
 */
export function Wordmark({
  className = '',
  titulo,
}: {
  className?: string;
  titulo?: string | null;
}) {
  return (
    <span
      {...(titulo ? { role: 'img' as const, 'aria-label': titulo } : { 'aria-hidden': true })}
      className={`inline-block bg-current ${className}`}
      style={{
        aspectRatio: '3324 / 476',
        maskImage: 'url(/marca/wordmark.svg)',
        WebkitMaskImage: 'url(/marca/wordmark.svg)',
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskSize: 'contain',
        WebkitMaskSize: 'contain',
      }}
    />
  );
}

/** Assinatura horizontal: simbolo a esquerda, lettering a direita. */
export default function Logotipo({
  className = '',
  titulo = 'Pétalas de Sonho',
}: {
  className?: string;
  titulo?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`} role="img" aria-label={titulo}>
      <Simbolo titulo={null} className="h-[1.55em] w-auto shrink-0" />
      {/* O creme e do logotipo, nao do tema: a marca nao muda de cor com o
          fundo. Passe text-* no className do lettering so para os casos de
          uma cor so, como o favicon monocromatico. */}
      <Wordmark className="h-[0.95em] text-[#fdf9db]" />
    </span>
  );
}
