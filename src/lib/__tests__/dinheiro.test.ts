import mongoose from 'mongoose';
import { describe, expect, it } from 'vitest';
import { eCentimos, formatarPreco } from '@/lib/dinheiro';
import { Order, Product } from '@/lib/models';

describe('dinheiro', () => {
  it('formata como se escreve em Portugal', () => {
    // Espaco inseparavel antes do simbolo: o preco nunca parte em duas linhas.
    expect(formatarPreco(2400)).toBe('24,00 €');
    expect(formatarPreco(4250)).toBe('42,50 €');
    expect(formatarPreco(5)).toBe('0,05 €');
  });

  it('so aceita inteiros nao negativos', () => {
    expect(eCentimos(1990)).toBe(true);
    expect(eCentimos(0)).toBe(true);
    for (const mau of [19.9, -1, Number.NaN, Infinity, '1990', null, 2 ** 53]) {
      expect(eCentimos(mau), String(mau)).toBe(false);
    }
  });
});

describe('os modelos recusam euros onde se esperam centimos', () => {
  // `validateSync` corre as validacoes do esquema sem base de dados.
  const produto = {
    name: 'Quartzo rosa',
    slug: 'quartzo-rosa',
    categoryId: new mongoose.Types.ObjectId(),
    variantes: [{ stock: 1 }],
  };

  it('produto', () => {
    expect(new Product({ ...produto, priceCents: 1990 }).validateSync()).toBeUndefined();
    expect(new Product({ ...produto, priceCents: 19.9 }).validateSync()?.errors.priceCents).toBeDefined();
    expect(new Product({ ...produto, priceCents: -100 }).validateSync()?.errors.priceCents).toBeDefined();
  });

  it('encomenda, nos totais e em cada linha', () => {
    const encomenda = (over: Record<string, unknown>) =>
      new Order({
        numero: '2026-000001',
        customerName: 'Marta Ferreira',
        customerEmail: 'marta@exemplo.pt',
        customerPhone: '910000000',
        deliveryType: 'SHIPPING',
        subtotalCents: 1990,
        totalCents: 1990,
        items: [{ productId: new mongoose.Types.ObjectId(), varianteId: new mongoose.Types.ObjectId(), name: 'x', priceCents: 1990, quantity: 1 }],
        ...over,
      }).validateSync();

    expect(encomenda({})).toBeUndefined();
    expect(encomenda({ totalCents: 19.9 })?.errors.totalCents).toBeDefined();
    expect(encomenda({ shippingCents: 3.5 })?.errors.shippingCents).toBeDefined();
    expect(
      encomenda({
        items: [{ productId: new mongoose.Types.ObjectId(), varianteId: new mongoose.Types.ObjectId(), name: 'x', priceCents: 19.9, quantity: 1 }],
      })?.errors['items.0.priceCents']
    ).toBeDefined();
  });
});

describe('o preço escrito num formulário', () => {
  it('lê-se como as pessoas o escrevem', async () => {
    const { centimosDeTexto } = await import('@/lib/dinheiro');
    expect(centimosDeTexto('19,90')).toBe(1990);
    expect(centimosDeTexto('19.9')).toBe(1990);
    expect(centimosDeTexto('19')).toBe(1900);
    expect(centimosDeTexto(' 19,90 € ')).toBe(1990);
    // Em virgula flutuante, 0.29 * 100 da 28.999999999999996.
    expect(centimosDeTexto('0,29')).toBe(29);
  });

  it('recusa o que não é um preço', async () => {
    const { centimosDeTexto } = await import('@/lib/dinheiro');
    for (const mau of ['', '-5', '1,999', '1.000,00', 'abc', '1e3']) {
      expect(centimosDeTexto(mau), mau).toBeNull();
    }
  });

  it('e volta ao campo como estava', async () => {
    const { centimosDeTexto, textoDeCentimos } = await import('@/lib/dinheiro');
    for (const c of [0, 5, 29, 1990, 123456]) expect(centimosDeTexto(textoDeCentimos(c))).toBe(c);
  });
});
