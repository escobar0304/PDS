import mongoose from 'mongoose';
import { describe, expect, it } from 'vitest';
import { problemasDasMedidas, stockTotal, temDeEscolher } from '@/lib/catalogo';
import { Product } from '@/lib/models';

describe('peças únicas', () => {
  it('uma medida sem nome, stock 0 ou 1', () => {
    expect(problemasDasMedidas([{ stock: 1 }], true)).toEqual([]);
    expect(problemasDasMedidas([{ stock: 0 }], true)).toEqual([]);
  });

  it('não têm medidas nem mais do que uma unidade', () => {
    // Uma peca unica e *aquela* pedra: duas unidades nao sao a mesma peca.
    expect(problemasDasMedidas([{ stock: 2 }], true)).toEqual(['peca-unica-com-stock-a-mais']);
    expect(problemasDasMedidas([{ medida: 'M', stock: 1 }], true)).toEqual(['peca-unica-com-medidas']);
    expect(problemasDasMedidas([{ stock: 1 }, { stock: 1 }], true)).toEqual(['peca-unica-com-medidas']);
  });
});

describe('modelos com medidas', () => {
  it('cada medida tem nome, e nenhuma se repete', () => {
    expect(problemasDasMedidas([{ medida: '14', stock: 3 }, { medida: '16', stock: 0 }], false)).toEqual([]);
    expect(problemasDasMedidas([{ medida: '14', stock: 3 }, { stock: 1 }], false)).toEqual(['medida-sem-nome']);
    expect(problemasDasMedidas([{ medida: 'M', stock: 1 }, { medida: ' m ', stock: 1 }], false)).toEqual([
      'medida-repetida',
    ]);
  });

  it('um produto sem medidas nenhumas não se grava', () => {
    expect(problemasDasMedidas([], false)).toEqual(['sem-medidas']);
    expect(problemasDasMedidas([], true)).toEqual(['sem-medidas']);
  });
});

describe('na loja', () => {
  it('só se escolhe medida quando há que escolher', () => {
    expect(temDeEscolher([{}])).toBe(false);
    expect(temDeEscolher([{ medida: 'Única' }])).toBe(true);
    expect(temDeEscolher([{ medida: '14' }, { medida: '16' }])).toBe(true);
  });

  it('o stock do produto é a soma das medidas', () => {
    expect(stockTotal([{ stock: 2 }, { stock: 0 }, { stock: 3 }])).toBe(5);
  });
});

describe('o esquema', () => {
  const base = { name: 'x', slug: 'x', priceCents: 100, categoryId: new mongoose.Types.ObjectId() };

  it('recusa um produto sem medidas, e stock negativo ou partido', () => {
    expect(new Product({ ...base, variantes: [] }).validateSync()?.errors.variantes).toBeDefined();
    expect(new Product({ ...base, variantes: [{ stock: -1 }] }).validateSync()).toBeDefined();
    expect(new Product({ ...base, variantes: [{ stock: 1.5 }] }).validateSync()).toBeDefined();
    expect(new Product({ ...base, variantes: [{ stock: 1 }] }).validateSync()).toBeUndefined();
  });
});
