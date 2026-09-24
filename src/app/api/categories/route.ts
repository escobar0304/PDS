import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Category } from '@/lib/models';
import { exigirAdmin } from '@/lib/autorizacao';
import { LIMITES, travar } from '@/lib/limites';
import { esquemaCategoria, lerCorpo } from '@/lib/validacao';

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

/**
 * Escrita, so para administracao.
 *
 * Ate aqui esta rota nao tinha verificacao nenhuma: qualquer pessoa na
 * internet podia criar categorias na base de dados. A pagina de administracao
 * estar protegida nao protegia isto — quem chama a API nao passa pela pagina.
 */
export async function POST(request: Request) {
  const permissao = await exigirAdmin();
  if (!permissao.ok) return permissao.resposta;

  const bloqueio = travar(request, 'admin', LIMITES.administracao, permissao.sessao.id);
  if (bloqueio) return bloqueio;

  const corpo = await lerCorpo(request, esquemaCategoria);
  if (!corpo.ok) {
    return NextResponse.json({ error: corpo.erro }, { status: 400 });
  }

  const { name, slug, description, image, order } = corpo.dados;

  try {
    await connectDB();

    const existente = await Category.findOne({ slug });
    if (existente) {
      return NextResponse.json(
        { error: 'Categoria com este slug já existe' },
        { status: 409 },
      );
    }

    const categoria = await Category.create({
      name,
      slug,
      description,
      image,
      order: order ?? 0,
    });

    return NextResponse.json(categoria, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    return NextResponse.json({ error: 'Erro ao criar categoria' }, { status: 500 });
  }
}
