import { describe, expect, it } from 'vitest';
import {
  esquemaEdicaoProduto,
  esquemaMovimento,
  esquemaNovaCategoria,
  esquemaNovoProduto,
} from '@/lib/validacao';

const ID = 'a'.repeat(24);

const produto = {
  name: 'Drusa de ametista',
  slug: 'drusa-de-ametista',
  priceCents: 4500,
  weightGrams: 350,
  categoryId: ID,
  images: ['/images/drusa.webp'],
  featured: false,
  active: true,
  variantes: [{ stock: 1 }],
};

describe('o painel só manda o que pode mandar', () => {
  it('um produto novo válido passa', () => {
    expect(esquemaNovoProduto.safeParse(produto).success).toBe(true);
  });

  it('a edição não aceita stock: o stock muda por movimentos', () => {
    expect(esquemaEdicaoProduto.safeParse({ variantes: [{ _id: ID, medida: '14' }] }).success).toBe(true);
    expect(esquemaEdicaoProduto.safeParse({ variantes: [{ _id: ID, stock: 9 }] }).success).toBe(false);
    expect(esquemaEdicaoProduto.safeParse({ stock: 9 }).success).toBe(false);
  });

  it('campos que ninguém pediu são recusados, e não ignorados', () => {
    expect(esquemaNovoProduto.safeParse({ ...produto, createdAt: '2020-01-01' }).success).toBe(false);
    expect(esquemaEdicaoProduto.safeParse({ _id: ID }).success).toBe(false);
  });

  it('o peso é obrigatório, em gramas inteiras: os portes dependem dele', () => {
    const { weightGrams: _, ...semPeso } = produto;
    expect(esquemaNovoProduto.safeParse(semPeso).success).toBe(false);
    expect(esquemaNovoProduto.safeParse({ ...produto, weightGrams: 0.5 }).success).toBe(false);
  });

  it('imagens só do próprio sítio', () => {
    // Um URL de fora e um terceiro contactado por cada visita.
    for (const mau of [
      'https://images.unsplash.com/x.jpg',
      '//evil.example/x.png',
      '/images/../../etc/passwd.png',
      '/images/x.svg',
      'javascript:alert(1)',
    ]) {
      expect(esquemaNovoProduto.safeParse({ ...produto, images: [mau] }).success, mau).toBe(false);
    }
  });

  it('a categoria nova tem de dizer se as peças são únicas', () => {
    expect(esquemaNovaCategoria.safeParse({ name: 'Anéis', slug: 'aneis' }).success).toBe(false);
    expect(
      esquemaNovaCategoria.safeParse({ name: 'Anéis', slug: 'aneis', pecasUnicas: false }).success
    ).toBe(true);
  });
});

describe('movimentos de stock', () => {
  const m = (over: object) => esquemaMovimento.safeParse({ varianteId: ID, ...over }).success;

  it('vender e partir tiram; a entrada acrescenta; o acerto vai para os dois lados', () => {
    expect(m({ delta: -1, motivo: 'venda-loja' })).toBe(true);
    expect(m({ delta: 1, motivo: 'venda-loja' })).toBe(false);
    expect(m({ delta: -1, motivo: 'quebra' })).toBe(true);
    expect(m({ delta: 1, motivo: 'quebra' })).toBe(false);
    expect(m({ delta: 5, motivo: 'entrada' })).toBe(true);
    expect(m({ delta: -5, motivo: 'entrada' })).toBe(false);
    expect(m({ delta: -2, motivo: 'acerto' })).toBe(true);
    expect(m({ delta: 2, motivo: 'acerto' })).toBe(true);
  });

  it('as reservas são do sistema: o painel não as faz', () => {
    expect(m({ delta: -1, motivo: 'reserva-online' })).toBe(false);
    expect(m({ delta: 1, motivo: 'reserva-libertada' })).toBe(false);
  });

  it('nem zero, nem partido, nem um valor absoluto disfarçado', () => {
    expect(m({ delta: 0, motivo: 'acerto' })).toBe(false);
    expect(m({ delta: 1.5, motivo: 'entrada' })).toBe(false);
    expect(m({ stock: 3, motivo: 'acerto' })).toBe(false);
  });
});
