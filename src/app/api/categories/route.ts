import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Category } from '@/lib/models';
import { LIMITES, travar } from '@/lib/limites';

/** Leitura publica: o catalogo e para ser visto. */
export async function GET(request: Request) {
  const bloqueio = travar(request, 'catalogo', LIMITES.leitura);
  if (bloqueio) return bloqueio;

  try {
    await connectDB();
    const categorias = await Category.find().sort({ order: 1, name: 1 });
    return NextResponse.json(categorias);
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    return NextResponse.json({ error: 'Erro ao buscar categorias' }, { status: 500 });
  }
}

// A escrita passou para `/api/admin/categorias`: todas as rotas de
// administracao vivem sob `/api/admin`, onde `rotas-seguras.test.ts` exige
// `exigirAdmin()` a cabeca de cada metodo.
