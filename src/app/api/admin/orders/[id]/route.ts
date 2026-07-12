import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import connectDB from '@/lib/db';
import { Order } from '@/lib/models';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    await connectDB();
    const order = await Order.findById(params.id).lean();

    if (!order) return NextResponse.json({ error: 'Encomenda não encontrada' }, { status: 404 });

    return NextResponse.json(order);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar encomenda' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    await connectDB();

    const body = await request.json();
    const allowedFields = ['status', 'notes'];
    const update: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) update[field] = body[field];
    }

    const updated = await Order.findByIdAndUpdate(params.id, update, { new: true }).lean();

    if (!updated) return NextResponse.json({ error: 'Encomenda não encontrada' }, { status: 404 });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Erro ao atualizar encomenda:', error);
    return NextResponse.json({ error: 'Erro ao atualizar encomenda' }, { status: 500 });
  }
}
