import { NextResponse } from 'next/server';
import type { Recusa } from '@/lib/gestao';

/**
 * A resposta HTTP de cada recusa do painel. As mensagens sao para quem esta
 * no painel — um administrador autenticado —, por isso dizem o que falhou;
 * as rotas publicas nao dizem (ver `lerCorpo`).
 */
const RECUSAS: Record<Recusa['erro'], { estado: number; mensagem: string }> = {
  'nao-existe': { estado: 404, mensagem: 'Não existe.' },
  'categoria-inexistente': { estado: 422, mensagem: 'A categoria não existe.' },
  'slug-repetido': { estado: 409, mensagem: 'Já existe outro com este endereço.' },
  medidas: { estado: 422, mensagem: 'As medidas não cumprem a regra da categoria.' },
  'medida-removida': {
    estado: 422,
    mensagem: 'Uma medida não se apaga: pode haver encomendas que apontam para ela.',
  },
  'sem-stock': { estado: 409, mensagem: 'Não há stock que chegue.' },
  'acima-do-maximo': { estado: 409, mensagem: 'Uma peça única não passa de uma unidade.' },
  'produtos-incompativeis': {
    estado: 409,
    mensagem: 'Há produtos nesta categoria que deixavam de cumprir a regra.',
  },
};

export function respostaDeRecusa(r: Recusa): NextResponse {
  const { estado, mensagem } = RECUSAS[r.erro];
  const { erro, ...detalhe } = r;
  return NextResponse.json({ error: mensagem, codigo: erro, ...detalhe }, { status: estado });
}
