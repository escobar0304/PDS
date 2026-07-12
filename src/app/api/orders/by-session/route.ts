import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Order } from '@/lib/models';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json({ error: 'session_id em falta' }, { status: 400 });
  }

  try {
    await connectDB();

    const order = await Order.findOne({ stripePaymentId: sessionId }).lean();

    if (!order) {
      return NextResponse.json({ error: 'Encomenda não encontrada' }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Erro ao buscar encomenda por sessão:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
