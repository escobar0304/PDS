import { describe, expect, it } from 'vitest';
import { mensagemDoProblema } from '@/components/checkout/problemas';
import type { Problema } from '@/lib/encomenda';
import { esquemaAcaoEncomenda, esquemaCheckout, esquemaCliente, esquemaDesistencia } from '@/lib/validacao';

/**
 * O checkout do lado do servidor: o que o esquema aceita e recusa. O
 * formulario corre o mesmo esquema, mas e este que conta.
 */

const ID = 'a'.repeat(24);
const CLIENTE = {
  nome: 'Marta Silva',
  email: 'Marta@Exemplo.pt',
  telefone: '912 345 678',
  morada: 'Rua das Flores, 12',
  codigoPostal: '4000-123',
  localidade: 'Porto',
};
const PEDIDO = {
  linhas: [{ id: ID, quantidade: 1 }],
  cliente: CLIENTE,
  entrega: 'SHIPPING',
  totalVistoCents: 4950,
};

describe('os dados de quem compra', () => {
  it('aceita, e guarda o email em minúsculas e o telefone sem espaços', () => {
    const r = esquemaCliente.parse(CLIENTE);
    expect(r.email).toBe('marta@exemplo.pt');
    expect(r.telefone).toBe('912345678');
  });

  it.each([
    ['4000-123', true],
    ['1000-001', true],
    ['8900-000', true],
    // Madeira e Acores: fora da zona de envio.
    ['9000-018', false],
    ['9500-150', false],
    ['4000123', false],
    ['0000-000', false],
  ])('código postal %s: %s', (codigoPostal, aceite) => {
    expect(esquemaCliente.safeParse({ ...CLIENTE, codigoPostal }).success).toBe(aceite);
  });

  it.each([
    ['912345678', true],
    ['+351 912 345 678', true],
    ['223 456 789', true],
    ['+34 612 345 678', true],
    ['12345', false],
    ['812345678', false],
    ['+351 12', false],
    ['telefone', false],
  ])('telefone %s: %s', (telefone, aceite) => {
    expect(esquemaCliente.safeParse({ ...CLIENTE, telefone }).success).toBe(aceite);
  });

  it('um objeto no lugar de um texto é recusado', () => {
    expect(esquemaCliente.safeParse({ ...CLIENTE, email: { $ne: null } }).success).toBe(false);
  });

  it('um campo a mais é recusado, e não ignorado', () => {
    expect(esquemaCliente.safeParse({ ...CLIENTE, role: 'ADMIN' }).success).toBe(false);
  });
});

describe('o pedido de encomenda', () => {
  it('aceita um pedido honesto', () => {
    expect(esquemaCheckout.safeParse(PEDIDO).success).toBe(true);
  });

  it('um preço numa linha é recusado', () => {
    const r = esquemaCheckout.safeParse({ ...PEDIDO, linhas: [{ id: ID, quantidade: 1, priceCents: 1 }] });
    expect(r.success).toBe(false);
  });

  it('o levantamento na loja é recusado enquanto não estiver decidido', () => {
    expect(esquemaCheckout.safeParse({ ...PEDIDO, entrega: 'PICKUP' }).success).toBe(false);
  });

  it('sem o total que a pessoa viu, é recusado', () => {
    const { totalVistoCents: _, ...sem } = PEDIDO;
    expect(esquemaCheckout.safeParse(sem).success).toBe(false);
    expect(esquemaCheckout.safeParse({ ...PEDIDO, totalVistoCents: 49.5 }).success).toBe(false);
  });
});

describe('a desistência', () => {
  it('só aceita uma chave com a forma das que se geram', () => {
    expect(esquemaDesistencia.safeParse({ chave: 'A'.repeat(43) }).success).toBe(true);
    expect(esquemaDesistencia.safeParse({ chave: 'A'.repeat(42) }).success).toBe(false);
    expect(esquemaDesistencia.safeParse({ chave: { $gt: '' } }).success).toBe(false);
  });
});

describe('os problemas, em português', () => {
  const linhas = [
    { _id: ID, varianteId: 'b'.repeat(24), name: 'Anel de ametista', medida: '14' },
    { _id: 'c'.repeat(24), varianteId: 'd'.repeat(24), name: 'Drusa' },
  ];

  it('cada tipo tem uma mensagem, com o nome da peça quando a há', () => {
    const casos: [Problema, string][] = [
      [{ tipo: 'indisponivel', id: 'c'.repeat(24) }, 'Drusa já não está à venda'],
      [{ tipo: 'medida-por-escolher', id: ID }, 'falta escolher a medida'],
      [{ tipo: 'stock', id: ID, varianteId: 'b'.repeat(24), disponivel: 0 }, 'Anel de ametista, medida 14 esgotou'],
      [{ tipo: 'stock', id: ID, varianteId: 'b'.repeat(24), disponivel: 2 }, 'só há 2'],
      [{ tipo: 'sem-peso', id: 'c'.repeat(24) }, 'portes de Drusa'],
      [{ tipo: 'acima-do-ultimo-escalao', gramas: 40000 }, 'peso máximo'],
      [{ tipo: 'sem-tabela' }, 'portes'],
      [{ tipo: 'total-mudou', totalCents: 5450 }, '54,50'],
    ];
    for (const [p, esperado] of casos) expect(mensagemDoProblema(p, linhas)).toContain(esperado);
  });

  it('uma peça que já não está no carrinho não parte a mensagem', () => {
    expect(mensagemDoProblema({ tipo: 'indisponivel', id: 'e'.repeat(24) }, linhas)).toMatch(/^Uma das peças/);
  });
});

describe('o que o painel faz a uma encomenda', () => {
  it('o seguimento fica em maiúsculas e sem espaços', () => {
    expect(esquemaAcaoEncomenda.parse({ acao: 'expedir', seguimento: ' rr 123 456 789 pt ' })).toEqual({
      acao: 'expedir',
      seguimento: 'RR123456789PT',
    });
  });

  it.each([
    [{ acao: 'expedir', seguimento: '' }],
    [{ acao: 'expedir', seguimento: 'RR-123' }],
    [{ acao: 'expedir' }],
    [{ acao: 'apagar' }],
    [{ acao: 'concluir', status: 'COMPLETED' }],
    [{ acao: 'reembolsar', valorCents: 100 }],
  ])('recusa %j', (corpo) => {
    expect(esquemaAcaoEncomenda.safeParse(corpo).success).toBe(false);
  });
});
