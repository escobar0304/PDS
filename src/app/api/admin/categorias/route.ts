import { NextResponse } from 'next/server';
import { exigirAdmin } from '@/lib/autorizacao';
import connectDB from '@/lib/db';
import { LIMITES, travar } from '@/lib/limites';
import { Category } from '@/lib/models';
import { esquemaNovaCategoria, lerCorpo } from '@/lib/validacao';

export async function POST(request: Request) {
  const permissao = await exigirAdmin();
  if (!permissao.ok) return permissao.resposta;

  const bloqueio = travar(request, 'admin', LIMITES.administracao, permissao.sessao.id);
  if (bloqueio) return bloqueio;

  const corpo = await lerCorpo(request, esquemaNovaCategoria);
  if (!corpo.ok) return NextResponse.json({ error: corpo.erro }, { status: 400 });

  try {
    await connectDB();
    const categoria = await Category.create({ order: 0, ...corpo.dados });
    return NextResponse.json({ id: categoria._id.toString() }, { status: 201 });
  } catch (erro) {
    if ((erro as { code?: number })?.code === 11000) {
      return NextResponse.json({ error: 'Já existe uma categoria com este nome ou endereço.' }, { status: 409 });
    }
    console.error('Admin: erro ao criar categoria:', erro);
    return NextResponse.json({ error: 'Erro ao criar categoria' }, { status: 500 });
  }
}
