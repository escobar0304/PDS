import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * A paleta, medida (docs/PALETA.md). Le os tokens do `globals.css`, nos dois
 * modos, e verifica o que a teoria das cores e a WCAG pedem e o olho nao
 * garante: que o texto se le, que o erro nao se confunde com a marca, e que as
 * superficies se distinguem umas das outras.
 *
 * As distancias sao em OKLab, onde distancias iguais sao diferencas que se
 * veem iguais; 0,02 e mais ou menos o limiar do que se nota.
 */

const CSS = readFileSync(join(__dirname, '..', '..', 'app', 'globals.css'), 'utf8');

function tokens(bloco: string): Record<string, string> {
  return Object.fromEntries([...bloco.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-f]{6})\s*;/gi)].map((m) => [m[1], m[2]]));
}

const [claroBruto, escuroBruto] = CSS.split('@media (prefers-color-scheme: dark)');
const CLARO = tokens(claroBruto);
const ESCURO = { ...CLARO, ...tokens(escuroBruto.slice(0, escuroBruto.indexOf('color-scheme: dark'))) };

const linear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const rgb = (h: string) => [1, 3, 5].map((i) => linear(parseInt(h.slice(i, i + 2), 16) / 255));

function luminancia(h: string) {
  const [r, g, b] = rgb(h);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contraste(a: string, b: string) {
  const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
function oklab(h: string) {
  const [r, g, b] = rgb(h);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}
const deltaE = (a: string, b: string) => Math.hypot(...oklab(a).map((v, i) => v - oklab(b)[i]));

/** Texto sobre fundo, como o sitio os usa. */
const PARES: [string, string][] = [
  ...['ink', 'ink-muted', 'rose-700', 'sage-600', 'danger-700'].flatMap((t) =>
    ['surface', 'surface-raised', 'surface-sunken'].map((f) => [t, f] as [string, string])
  ),
  ['rose-900', 'rose-100'],
  ['rose-700', 'rose-100'],
  ['danger-700', 'danger-100'],
  ['sage-600', 'sage-100'],
  // Os botoes: texto da superficie sobre o acento cheio.
  ['surface', 'rose-700'],
  ['surface', 'danger-700'],
  ['surface', 'sage-600'],
];

describe.each([
  ['claro', CLARO],
  ['escuro', ESCURO],
])('a paleta em modo %s', (_, t) => {
  it('encontra os tokens', () => {
    expect(Object.keys(t).length).toBeGreaterThan(15);
  });

  it.each(PARES)('%s sobre %s passa os 4,5:1', (texto, fundo) => {
    expect(contraste(t[texto], t[fundo])).toBeGreaterThanOrEqual(4.5);
  });

  it('o erro não se confunde com o acento da marca', () => {
    // Estavam a 0,045, com a mesma luminosidade: um aviso de erro e uma
    // ligacao pareciam a mesma coisa.
    expect(deltaE(t['rose-700'], t['danger-700'])).toBeGreaterThanOrEqual(0.09);
  });

  it('a superfície rebaixada distingue-se da página', () => {
    // O rodape e os blocos de destaque assentam nela. A 0,026 mal se via.
    expect(deltaE(t.surface, t['surface-sunken'])).toBeGreaterThanOrEqual(0.03);
  });
});
