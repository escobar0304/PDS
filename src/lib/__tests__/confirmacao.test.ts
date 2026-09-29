import { describe, expect, it } from 'vitest';
import { estadoParaPessoa } from '@/components/checkout/estado';
import {
  textoDaConfirmacao,
  textoDaExpedicao,
  textoDoReembolso,
  textoParaALoja,
  type EncomendaParaAviso,
} from '@/lib/confirmacao';

/**
 * O email de confirmacao e obrigatorio e tem conteudo obrigatorio (DL 24/2014,
 * art. 6.º). Estes testes nao dizem que o texto esta juridicamente certo —
 * isso e do jurista —, dizem que nada do que la tem de estar sai por engano.
 */

// O Intl separa o valor do euro com um espaco que nao quebra (U+00A0).
const sp = (t: string) => t.replace(/\u00a0/g, ' ');

const E: EncomendaParaAviso = {
  numero: '2026-000042',
  criadaEm: new Date('2026-09-25T10:00:00Z'),
  customerName: 'Marta <b>Silva</b>',
  customerEmail: 'marta@exemplo.pt',
  customerPhone: '912345678',
  shippingAddress: 'Rua das Flores, 12',
  shippingPostal: '4000-123',
  shippingCity: 'Porto',
  items: [
    { name: 'Drusa de ametista', priceCents: 4500, quantity: 1 },
    { name: 'Anel', medida: '14', priceCents: 1990, quantity: 2 },
  ],
  subtotalCents: 8480,
  shippingCents: 450,
  totalCents: 8930,
};

describe('a confirmação a quem comprou', () => {
  const r = textoDaConfirmacao(E, {
    prazoEntrega: '2 a 3 dias úteis',
    ligacao: 'https://loja.pt/encomenda/x?chave=y',
  });
  const assunto = sp(r.assunto);
  const texto = sp(r.texto);

  it('diz o número, as peças, os portes e o total', () => {
    expect(assunto).toContain('2026-000042');
    for (const t of ['Drusa de ametista', 'Anel, medida 14', '2 × 19,90 €', '4,50 €', '89,30 €', 'com IVA']) {
      expect(texto).toContain(t);
    }
  });

  it('diz a entrega: para onde, por quem e em quanto tempo', () => {
    for (const t of ['CTT', 'Portugal continental', '2 a 3 dias úteis', 'Rua das Flores, 12', '4000-123 Porto']) {
      expect(texto).toContain(t);
    }
  });

  it('traz o direito de desistir, com o formulário, e a garantia', () => {
    expect(texto).toContain('14 dias');
    expect(texto).toContain('FORMULÁRIO DE LIVRE RESOLUÇÃO');
    expect(texto).toContain('resolvo o meu contrato de compra e venda');
    expect(texto).toContain('Encomenda n.º 2026-000042, feita em 25 de setembro de 2026');
    expect(texto).toContain('3 anos de garantia legal');
    expect(texto).toContain('Os portes da devolução ficam a seu cargo');
  });

  it('diz quem vende, e o que falta diz que falta', () => {
    expect(texto).toContain('QUEM VENDE');
    expect(texto).toContain('CICAP');
    expect(texto).toContain('https://www.livroreclamacoes.pt');
    // Os dados da empresa estao a null: o email nao os inventa.
    expect(texto).toContain('(por preencher)');
  });

  it('é texto, e o nome de quem comprou fica como veio', () => {
    // Sem HTML nao ha onde injetar: `<b>` e so texto.
    expect(texto).toContain('Olá Marta <b>Silva</b>,');
    expect(texto).not.toMatch(/<(html|a|p|div)\b/);
  });

  it('sem chave verificada, sem ligação', () => {
    const sem = textoDaConfirmacao(E, { prazoEntrega: 'x', ligacao: null }).texto;
    expect(sem).not.toContain('/encomenda/');
    expect(texto).toContain('https://loja.pt/encomenda/x?chave=y');
  });
});

describe('o aviso à loja', () => {
  it('uma encomenda paga, com quem, para onde e o quê', () => {
    const r = textoParaALoja(E, 'paga');
    const [assunto, texto] = [sp(r.assunto), sp(r.texto)];
    expect(assunto).toBe('Encomenda paga: 2026-000042 — 89,30 €');
    for (const t of ['marta@exemplo.pt', '912345678', 'Rua das Flores, 12', 'Drusa de ametista']) {
      expect(texto).toContain(t);
    }
  });

  it('o que a loja tem de resolver diz-se no assunto', () => {
    expect(textoParaALoja(E, 'paga-depois-de-cancelada').assunto).toMatch(/^A resolver/);
    const d = textoParaALoja(E, 'valor-divergente', 100);
    expect(d.assunto).toMatch(/^A resolver/);
    expect(sp(d.texto)).toContain('1,00 €');
  });
});

describe('depois da confirmação', () => {
  it('a expedição leva o seguimento, e diz desde quando contam os 14 dias', () => {
    const { assunto, texto } = textoDaExpedicao(E, 'RR123456789PT');
    expect(assunto).toContain('enviada');
    expect(texto).toContain('Número de seguimento: RR123456789PT');
    expect(texto).toContain('14 dias');
  });

  it('o reembolso diz quanto e por onde', () => {
    const texto = sp(textoDoReembolso(E).texto);
    expect(texto).toContain('89,30 €');
    expect(texto).toContain('pelo mesmo meio');
  });
});

describe('o estado dito a quem comprou', () => {
  const base = {
    status: 'PENDING' as const,
    paymentStatus: 'PENDING' as const,
    pagoDepoisDeCancelada: false,
    pagamentoDivergente: false,
    confirmacaoEnviada: false,
    customerEmail: 'marta@exemplo.pt',
  };

  it('por pagar, espera, e diz para não pagar outra vez', () => {
    const e = estadoParaPessoa(base);
    expect(e.aEsperar).toBe(true);
    expect(e.detalhe).toContain('Não pague outra vez');
  });

  it('paga, diz para onde foi a confirmação', () => {
    const e = estadoParaPessoa({ ...base, status: 'PROCESSING', paymentStatus: 'PAID', confirmacaoEnviada: true });
    expect(e).toMatchObject({ tom: 'sucesso', aEsperar: false });
    expect(e.detalhe).toContain('Enviámos a confirmação para marta@exemplo.pt');
  });

  it('cancelada sem pagar: nada foi cobrado; paga e cancelada: não diz isso', () => {
    expect(estadoParaPessoa({ ...base, status: 'CANCELLED' }).detalhe).toContain('nada foi cobrado');
    expect(estadoParaPessoa({ ...base, status: 'CANCELLED', paymentStatus: 'PAID' }).detalhe).not.toContain(
      'nada foi cobrado'
    );
  });

  it('enviada, com o seguimento', () => {
    expect(estadoParaPessoa({ ...base, status: 'SHIPPED', paymentStatus: 'PAID', seguimento: 'RR1PT' }).detalhe).toContain(
      'RR1PT'
    );
  });

  it('paga depois de cancelada ganha a tudo o resto', () => {
    const e = estadoParaPessoa({ ...base, status: 'CANCELLED', paymentStatus: 'PAID', pagoDepoisDeCancelada: true });
    expect(e.titulo).toContain('depois de a reserva expirar');
    expect(e.tom).toBe('erro');
  });
});
