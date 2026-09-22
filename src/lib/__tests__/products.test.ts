import { describe, expect, it } from 'vitest';
import { resolveLimit, resolveSort, SORTS, SORT_KEYS } from '@/lib/products';

// As opcoes que a loja oferece no <select>. Se uma delas deixar de existir no
// servidor, a ordenacao passa a cair em silencio no valor por omissao.
const OPCOES_NA_LOJA = [
  'featured',
  'price-asc',
  'price-desc',
  'name-asc',
  'name-desc',
  'newest',
];

describe('resolveSort', () => {
  it('cobre todas as opcoes que a loja mostra ao utilizador', () => {
    for (const opcao of OPCOES_NA_LOJA) {
      expect(SORT_KEYS).toContain(opcao);
      expect(resolveSort(opcao)).toBe(SORTS[opcao as keyof typeof SORTS]);
    }
  });

  it('cai em destaques quando o valor e desconhecido, nulo ou vazio', () => {
    expect(resolveSort('inventado')).toBe(SORTS.featured);
    expect(resolveSort(null)).toBe(SORTS.featured);
    expect(resolveSort(undefined)).toBe(SORTS.featured);
    expect(resolveSort('')).toBe(SORTS.featured);
  });

  it('ordena o preco nos dois sentidos', () => {
    expect(resolveSort('price-asc')).toEqual({ price: 1 });
    expect(resolveSort('price-desc')).toEqual({ price: -1 });
  });
});

describe('resolveLimit', () => {
  it('aceita inteiros positivos', () => {
    expect(resolveLimit('4')).toBe(4);
  });

  it('trava em 100', () => {
    expect(resolveLimit('5000')).toBe(100);
  });

  it('rejeita o que nao e inteiro positivo', () => {
    for (const valor of [null, undefined, '', '0', '-3', 'abc', '2.5']) {
      expect(resolveLimit(valor)).toBeNull();
    }
  });
});
