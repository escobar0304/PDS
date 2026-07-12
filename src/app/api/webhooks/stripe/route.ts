import { NextResponse } from 'next/server';
import { stripe } from '@/services/stripe';
import connectDB from '@/lib/db';
import { Order, Product } from '@/lib/models';
import { sendOrderConfirmation, sendOrderNotificationToAdmin } from '@/services/mailer';
import Stripe from 'stripe';
import mongoose from 'mongoose';

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Sem assinatura Stripe' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('Webhook signature error:', err);
    return NextResponse.json({ error: 'Webhook inválido' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;

    if (!orderId) {
      return NextResponse.json({ error: 'orderId não encontrado' }, { status: 400 });
    }

    try {
      await connectDB();

      const order = await Order.findById(orderId);
      if (!order) {
        console.error('Encomenda não encontrada:', orderId);
        return NextResponse.json({ error: 'Encomenda não encontrada' }, { status: 404 });
      }

      // Idempotency: skip if already processed (Stripe retries webhooks on failure)
      if (order.paymentStatus === 'PAID') {
        return NextResponse.json({ received: true });
      }

      order.paymentStatus = 'PAID';
      order.status = 'PROCESSING';
      await order.save();

      // Decrease stock in parallel
      await Promise.all(
        order.items.map((item) =>
          Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } })
        )
      );

      // Send confirmation emails (fire & forget)
      try {
        await Promise.all([
          sendOrderConfirmation({
            _id: (order._id as mongoose.Types.ObjectId).toString(),
            customerName: order.customerName,
            customerEmail: order.customerEmail,
            total: order.total,
            items: order.items,
            deliveryType: order.deliveryType,
            shippingAddress: order.shippingAddress,
            shippingCity: order.shippingCity,
            shippingPostal: order.shippingPostal,
          }),
          sendOrderNotificationToAdmin({
            _id: (order._id as mongoose.Types.ObjectId).toString(),
            customerName: order.customerName,
            customerEmail: order.customerEmail,
            customerPhone: order.customerPhone,
            total: order.total,
            items: order.items,
            deliveryType: order.deliveryType,
          }),
        ]);
      } catch (emailErr) {
        console.error('Erro ao enviar emails:', emailErr);
      }
    } catch (err) {
      console.error('Erro ao processar webhook:', err);
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
