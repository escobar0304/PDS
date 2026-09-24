import { describe, expect, it } from 'vitest';
import { CONDICOES, condicoesEmFalta, type Escalao } from '@/lib/condicoes';
import { calcular, type ProdutoParaPreco } from '@/lib/encomenda';
import { formatarPeso, portesPara, tabelaValida } from '@/lib/portes';
import { esquemaPedido } from '@/lib/validacao';

const ID_A = 'a'.repeat(24);
const ID_B = 'b'.repeat(24);

const TABELA: Escalao[] = [
  { ateGramas: 500, precoCents: 350 },
  { ateGramas: 2000, precoCents: 600 },
];

const produto = (over: Partial<ProdutoParaPreco> = {}): ProdutoParaPreco => ({
  id: ID_A,
  name: 'Quartzo rosa',
  priceCents: 1990,
  stock: 5,
  weightGrams: 200,
  ...over,
});

describe('portes', () => {
  it('cada escalão cobre até ao seu limite, inclusive', () => {
    expect(portesPara(1, TABELA)).toBe(350);
    expect(portesPara(500, TABELA)).toBe(350);
    expect(portesPara(501, TABELA)).toBe(600);
    expect(portesPara(2000, TABELA)).toBe(600);
  });

  it('acima do último escalão não inventa um preço', () => {
    expect(portesPara(2001, TABELA)).toBeNull();
  });

  it('só aceita tabelas com que se fazem contas certas', () => {
    expect(tabelaValida(TABELA)).toBe(true);
    expect(tabelaValida([])).toBe(false);
    expect(tabelaValida([...TABELA].reverse())).toBe(false);
    expect(tabelaValida([{ ateGramas: 500, precoCents: 3.5 }])).toBe(false);
    expect(tabelaValida([{ ateGramas: 500, precoCents: 350 }, { ateGramas: 500, precoCents: 400 }])).toBe(false);
  });

  it('a tabela do negócio, quando for preenchida, é válida', () => {
    // Uma tabela mal preenchida nao conta: segura a indexacao como se faltasse.
    if (CONDICOES.tabelaPortes === null) {
      expect(condicoesEmFalta().map((f) => f.campo)).toContain('tabelaPortes');
    } else {
      expect(tabelaValida(CONDICOES.tabelaPortes)).toBe(true);
    }
  });

  it('escreve o peso como se lê', () => {
    expect(formatarPeso(250)).toBe('250 g');
    expect(formatarPeso(1500)).toBe('1,5 kg');
    expect(formatarPeso(2000)).toBe('2 kg');
  });
});

describe('o total de uma encomenda', () => {
  it('soma preços, peso e portes a partir dos produtos, não do pedido', () => {
    const r = calcular(
      [{ id: ID_A, quantidade: 2 }, { id: ID_B, quantidade: 1 }],
      [produto(), produto({ id: ID_B, name: 'Ametista', priceCents: 4250, weightGrams: 300 })],
      TABELA
    );
    expect(r).toEqual({
      ok: true,
      linhas: [
        { productId: ID_A, name: 'Quartzo rosa', priceCents: 1990, quantity: 2 },
        { productId: ID_B, name: 'Ametista', priceCents: 4250, quantity: 1 },
      ],
      pesoGramas: 700,
      subtotalCents: 8230,
      shippingCents: 600,
      totalCents: 8830,
    });
  });

  it('o mesmo produto em duas linhas conta uma vez, com as quantidades somadas', () => {
    // Senao, 3 + 3 de um produto com stock 5 passava linha a linha.
    const r = calcular(
      [{ id: ID_A, quantidade: 3 }, { id: ID_A, quantidade: 3 }],
      [produto()],
      TABELA
    );
    expect(r).toEqual({ ok: false, problemas: [{ tipo: 'stock', id: ID_A, disponivel: 5 }] });
  });

  it('não corrige o pedido em silêncio: devolve todos os problemas', () => {
    const r = calcular(
      [
        { id: ID_A, quantidade: 9 },
        { id: ID_B, quantidade: 1 },
        { id: 'c'.repeat(24), quantidade: 1 },
      ],
      [produto(), produto({ id: ID_B, weightGrams: undefined })],
      TABELA
    );
    expect(r).toEqual({
      ok: false,
      problemas: [
        { tipo: 'stock', id: ID_A, disponivel: 5 },
        { tipo: 'sem-peso', id: ID_B },
        { tipo: 'indisponivel', id: 'c'.repeat(24) },
      ],
    });
  });

  it('sem tabela de portes não há total', () => {
    expect(calcular([{ id: ID_A, quantidade: 1 }], [produto()], null)).toEqual({
      ok: false,
      problemas: [{ tipo: 'sem-tabela' }],
    });
  });

  it('acima do último escalão, diz o peso', () => {
    expect(
      calcular([{ id: ID_A, quantidade: 5 }], [produto({ weightGrams: 1000 })], TABELA)
    ).toEqual({ ok: false, problemas: [{ tipo: 'acima-do-ultimo-escalao', gramas: 5000 }] });
  });
});

describe('o pedido que chega do cliente', () => {
  it('aceita identificadores e quantidades', () => {
    expect(esquemaPedido.safeParse([{ id: ID_A, quantidade: 2 }]).success).toBe(true);
  });

  it('recusa um preço enviado junto, em vez de o ignorar', () => {
    const r = esquemaPedido.safeParse([{ id: ID_A, quantidade: 1, priceCents: 1 }]);
    expect(r.success).toBe(false);
  });

  it('recusa operadores, quantidades impossíveis e pedidos vazios', () => {
    for (const mau of [
      [{ id: { $ne: null }, quantidade: 1 }],
      [{ id: ID_A, quantidade: 0 }],
      [{ id: ID_A, quantidade: 1.5 }],
      [{ id: ID_A, quantidade: 100 }],
      [{ id: 'nao-e-um-id', quantidade: 1 }],
      [],
      Array.from({ length: 51 }, () => ({ id: ID_A, quantidade: 1 })),
    ]) {
      expect(esquemaPedido.safeParse(mau).success, JSON.stringify(mau).slice(0, 60)).toBe(false);
    }
  });
});
