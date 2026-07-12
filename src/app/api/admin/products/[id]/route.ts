import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import connectDB from '@/lib/db';
import { Product } from '@/lib/models';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    await connectDB();
    const product = await Product.findById(params.id).populate('categoryId', 'name slug').lean();

    if (!product) return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });

    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar produto' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    await connectDB();

    const body = await request.json();
    const updated = await Product.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    }).lean();

    if (!updated) return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    return NextResponse.json({ error: 'Erro ao atualizar produto' }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    await connectDB();

    const deleted = await Product.findByIdAndDelete(params.id);
    if (!deleted) return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao eliminar produto' }, { status: 500 });
  }
}
