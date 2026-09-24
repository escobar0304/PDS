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

const V_A = 'a1'.repeat(12);
const V_B = 'b1'.repeat(12);

/** Uma peca unica: uma medida so, sem nome. */
const produto = (over: Partial<ProdutoParaPreco> = {}): ProdutoParaPreco => ({
  id: ID_A,
  name: 'Quartzo rosa',
  priceCents: 1990,
  weightGrams: 200,
  variantes: [{ id: V_A, stock: 5 }],
  ...over,
});

/** Um anel, em duas medidas. */
const ANEL: ProdutoParaPreco = {
  id: ID_B,
  name: 'Anel de ametista',
  priceCents: 3500,
  weightGrams: 10,
  variantes: [
    { id: 'c1'.repeat(12), medida: '14', stock: 0 },
    { id: 'c2'.repeat(12), medida: '16', stock: 2 },
  ],
};

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
      [{ id: ID_A, quantidade: 2 }, { id: ID_B, varianteId: 'c2'.repeat(12), quantidade: 1 }],
      [produto(), ANEL],
      TABELA
    );
    expect(r).toEqual({
      ok: true,
      linhas: [
        { productId: ID_A, varianteId: V_A, name: 'Quartzo rosa', priceCents: 1990, quantity: 2 },
        {
          productId: ID_B,
          varianteId: 'c2'.repeat(12),
          medida: '16',
          name: 'Anel de ametista',
          priceCents: 3500,
          quantity: 1,
        },
      ],
      pesoGramas: 410,
      subtotalCents: 7480,
      shippingCents: 350,
      totalCents: 7830,
    });
  });

  it('uma peça única não precisa de medida; um anel precisa, e o servidor não a escolhe', () => {
    const r = calcular([{ id: ID_B, quantidade: 1 }], [ANEL], TABELA);
    expect(r).toEqual({ ok: false, problemas: [{ tipo: 'medida-por-escolher', id: ID_B }] });
  });

  it('o stock conta por medida', () => {
    // A medida 14 esta esgotada, mesmo com a 16 em stock.
    const r = calcular([{ id: ID_B, varianteId: 'c1'.repeat(12), quantidade: 1 }], [ANEL], TABELA);
    expect(r).toEqual({
      ok: false,
      problemas: [{ tipo: 'stock', id: ID_B, varianteId: 'c1'.repeat(12), disponivel: 0 }],
    });
  });

  it('uma medida que não é deste produto está indisponível', () => {
    const r = calcular([{ id: ID_B, varianteId: V_B, quantidade: 1 }], [ANEL], TABELA);
    expect(r).toEqual({ ok: false, problemas: [{ tipo: 'indisponivel', id: ID_B, varianteId: V_B }] });
  });

  it('a mesma medida em duas linhas conta uma vez, com as quantidades somadas', () => {
    // Senao, 3 + 3 de uma medida com stock 5 passava linha a linha — e a peca
    // unica sem medida no pedido e a mesma que a pedida pela medida.
    const r = calcular(
      [{ id: ID_A, quantidade: 3 }, { id: ID_A, varianteId: V_A, quantidade: 3 }],
      [produto()],
      TABELA
    );
    expect(r).toEqual({
      ok: false,
      problemas: [{ tipo: 'stock', id: ID_A, varianteId: V_A, disponivel: 5 }],
    });
  });

  it('não corrige o pedido em silêncio: devolve todos os problemas', () => {
    const r = calcular(
      [
        { id: ID_A, quantidade: 9 },
        { id: 'd'.repeat(24), quantidade: 1 },
        { id: 'e'.repeat(24), quantidade: 1 },
      ],
      [produto(), produto({ id: 'd'.repeat(24), weightGrams: undefined })],
      TABELA
    );
    expect(r).toEqual({
      ok: false,
      problemas: [
        { tipo: 'indisponivel', id: 'e'.repeat(24) },
        { tipo: 'stock', id: ID_A, varianteId: V_A, disponivel: 5 },
        { tipo: 'sem-peso', id: 'd'.repeat(24) },
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
