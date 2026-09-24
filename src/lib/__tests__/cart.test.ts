import { describe, expect, it } from 'vitest';
import {
  addItem,
  cartTotal,
  clampQuantity,
  countItems,
  parseStoredCart,
  removeItem,
  setQuantity,
  type CartItem,
  type CartProduct,
} from '@/lib/cart';

const produto = (over: Partial<CartProduct> = {}): CartProduct => ({
  _id: 'a1',
  name: 'Quartzo Rosa Bruto',
  slug: 'quartzo-rosa-bruto',
  priceCents: 2400,
  image: '/x.webp',
  stock: 3,
  ...over,
});

const item = (over: Partial<CartItem> = {}): CartItem => ({
  ...produto(),
  quantity: 1,
  ...over,
});

describe('clampQuantity', () => {
  it('nunca desce abaixo de 1', () => {
    expect(clampQuantity(0, 5)).toBe(1);
    expect(clampQuantity(-4, 5)).toBe(1);
  });

  it('nunca ultrapassa o stock', () => {
    expect(clampQuantity(9, 3)).toBe(3);
  });

  it('ignora valores que nao sao numeros finitos', () => {
    expect(clampQuantity(Number.NaN, 5)).toBe(1);
  });
});

describe('addItem', () => {
  it('limita ao stock um produto novo', () => {
    // Regressao: o caminho do produto novo nao limitava ao stock, ao contrario
    // do caminho do produto ja existente.
    const items = addItem([], produto({ stock: 3 }), 10);
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(3);
  });

  it('soma ao existente sem passar o stock', () => {
    const items = addItem([item({ quantity: 2, stock: 3 })], produto({ stock: 3 }), 5);
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(3);
  });

  it('recusa produtos esgotados', () => {
    expect(addItem([], produto({ stock: 0 }), 1)).toHaveLength(0);
  });

  it('nao altera o array recebido', () => {
    const inicial: CartItem[] = [];
    addItem(inicial, produto());
    expect(inicial).toHaveLength(0);
  });
});

describe('setQuantity', () => {
  it('remove o item quando a quantidade chega a zero', () => {
    expect(setQuantity([item()], 'a1', 0)).toHaveLength(0);
  });

  it('limita ao stock', () => {
    expect(setQuantity([item({ stock: 2 })], 'a1', 99)[0].quantity).toBe(2);
  });

  it('ignora ids desconhecidos', () => {
    const items = setQuantity([item()], 'nao-existe', 5);
    expect(items[0].quantity).toBe(1);
  });
});

describe('removeItem', () => {
  it('remove so o item indicado', () => {
    const items = removeItem([item(), item({ _id: 'b2' })], 'a1');
    expect(items.map((i) => i._id)).toEqual(['b2']);
  });
});

describe('totais', () => {
  it('conta unidades e nao linhas', () => {
    expect(countItems([item({ quantity: 2 }), item({ _id: 'b2', quantity: 3 })])).toBe(5);
  });

  it('soma preco vezes quantidade, em centimos', () => {
    expect(
      cartTotal([
        item({ priceCents: 2400, quantity: 2 }),
        item({ _id: 'b2', priceCents: 1050, quantity: 1 }),
      ])
    ).toBe(5850);
  });

  it('nao acumula erro de virgula flutuante', () => {
    // Em euros, 19.9 * 3 da 59.699999999999996.
    expect(cartTotal([item({ priceCents: 1990, quantity: 3 })])).toBe(5970);
  });

  it('carrinho vazio vale zero', () => {
    expect(countItems([])).toBe(0);
    expect(cartTotal([])).toBe(0);
  });
});

describe('parseStoredCart', () => {
  it('devolve vazio sem dados', () => {
    expect(parseStoredCart(null)).toEqual([]);
  });

  it('devolve vazio com JSON invalido em vez de rebentar', () => {
    expect(parseStoredCart('{nao e json')).toEqual([]);
  });

  it('descarta entradas com a forma errada', () => {
    const raw = JSON.stringify([item(), { _id: 'mau' }, null, 42]);
    const items = parseStoredCart(raw);
    expect(items).toHaveLength(1);
    expect(items[0]._id).toBe('a1');
  });

  it('descarta precos que nao sao centimos inteiros', () => {
    // Inclui os carrinhos guardados antes da mudanca, com `price` em euros:
    // tentar converte-los era adivinhar, e o preco vem sempre do servidor.
    const raw = JSON.stringify([
      item({ _id: 'bom' }),
      { ...item({ _id: 'euros' }), priceCents: 19.9 },
      { ...item({ _id: 'antigo' }), priceCents: undefined, price: 24 },
      { ...item({ _id: 'negativo' }), priceCents: -100 },
    ]);
    expect(parseStoredCart(raw).map((i) => i._id)).toEqual(['bom']);
  });
});
