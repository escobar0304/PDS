import { NextResponse } from 'next/server';
import { calcularEncomenda } from '@/lib/encomenda';
import { LIMITES, travar } from '@/lib/limites';
import { estadoDaLoja } from '@/lib/loja';
import { esquemaOrcamento, lerCorpo } from '@/lib/validacao';

/**
 * O total com portes, antes de encomendar: e o que o checkout mostra
 * imediatamente antes do botao (DL 24/2014, art. 4.º). Calculado aqui, pela
 * mesma funcao que a encomenda usa, para os dois nunca discordarem.
 *
 * Os problemas (stock, medida por escolher, peca desativada) voltam com 200:
 * para um orcamento, sao uma resposta, nao um erro.
 */
export async function POST(request: Request) {
  const bloqueio = travar(request, 'orcamento', LIMITES.orcamento);
  if (bloqueio) return bloqueio;

  const loja = estadoDaLoja();
  if (!loja.aberta) {
    return NextResponse.json({ error: 'A loja online ainda não aceita encomendas.' }, { status: 503 });
  }

  const corpo = await lerCorpo(request, esquemaOrcamento);
  if (!corpo.ok) return NextResponse.json({ error: corpo.erro }, { status: 400 });

  try {
    return NextResponse.json(await calcularEncomenda(corpo.dados.linhas, loja.condicoes.tabelaPortes));
  } catch (erro) {
    console.error('Orçamento: erro ao calcular:', erro);
    return NextResponse.json({ error: 'Erro ao calcular o total.' }, { status: 500 });
  }
}
