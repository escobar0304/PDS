import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/lib/models';
import { exigirSessao } from '@/lib/autorizacao';
import { LIMITES, travar } from '@/lib/limites';
import { esquemaMaioridade, lerCorpo } from '@/lib/validacao';
import { registarErro } from '@/lib/registo';

/**
 * A declaracao de maioridade de quem ainda nao a fez: quem entrou pela Google
 * pela primeira vez, que nunca passou pela caixa do registo.
 *
 * Escreve-se na conta da sessao, nunca num id do pedido, e so uma vez: a
 * data que fica e a primeira.
 */
export async function POST(pedido: Request) {
  const permissao = await exigirSessao();
  if (!permissao.ok) return permissao.resposta;

  const bloqueio = travar(pedido, 'conta', LIMITES.conta, permissao.sessao.id);
  if (bloqueio) return bloqueio;

  const corpo = await lerCorpo(pedido, esquemaMaioridade);
  if (!corpo.ok) return NextResponse.json({ error: corpo.erro }, { status: 400 });

  try {
    await connectDB();
    const r = await User.updateOne(
      { _id: permissao.sessao.id, maioridadeDeclaradaEm: { $exists: false } },
      { $set: { maioridadeDeclaradaEm: new Date() } },
    );
    if (r.matchedCount === 0 && !(await User.exists({ _id: permissao.sessao.id }))) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (erro) {
    registarErro('Erro ao guardar a declaração de maioridade:', erro);
    return NextResponse.json({ error: 'Não foi possível guardar.' }, { status: 500 });
  }
}
