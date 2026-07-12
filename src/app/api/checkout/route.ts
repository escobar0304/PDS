import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import { Order, Product } from '@/lib/models';
import { createCheckoutSession } from '@/services/stripe';
import mongoose from 'mongoose';

const SHIPPING_COST = 4.5;
const FREE_SHIPPING_THRESHOLD = 50;

export async function POST(request: Request) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    const body = await request.json();

    const {
      items,
      customerName,
      customerEmail,
      customerPhone,
      deliveryType,
      shippingAddress,
      shippingCity,
      shippingPostal,
      shippingCountry = 'Portugal',
      notes,
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Carrinho vazio' }, { status: 400 });
    }

    if (items.length > 50) {
      return NextResponse.json({ error: 'Demasiados itens no carrinho' }, { status: 400 });
    }

    if (!customerName || !customerEmail || !customerPhone || !deliveryType) {
      return NextResponse.json({ error: 'Dados do cliente incompletos' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }

    if (!['SHIPPING', 'PICKUP'].includes(deliveryType)) {
      return NextResponse.json({ error: 'Tipo de entrega inválido' }, { status: 400 });
    }

    if (deliveryType === 'SHIPPING' && (!shippingAddress || !shippingCity || !shippingPostal)) {
      return NextResponse.json({ error: 'Morada de entrega incompleta' }, { status: 400 });
    }

    // Validate ObjectId format and quantities before any DB call
    for (const item of items) {
      if (!mongoose.Types.ObjectId.isValid(item._id)) {
        return NextResponse.json({ error: 'ID de produto inválido' }, { status: 400 });
      }
      const qty = parseInt(item.quantity);
      if (!Number.isInteger(qty) || qty < 1 || qty > 999) {
        return NextResponse.json({ error: 'Quantidade inválida' }, { status: 400 });
      }
    }

    // Validate products and calculate totals from DB to prevent price tampering
    const productIds = items.map((i: { _id: string }) => new mongoose.Types.ObjectId(i._id));
    const dbProducts = await Product.find({ _id: { $in: productIds }, active: true });

    const orderItems = items.map((item: { _id: string; quantity: number }) => {
      const product = dbProducts.find((p) => (p._id as mongoose.Types.ObjectId).toString() === item._id);
      if (!product) throw new Error(`Produto ${item._id} não encontrado`);
      if (product.stock < item.quantity) throw new Error(`Stock insuficiente para ${product.name}`);
      return {
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.images[0],
      };
    });

    const subtotal = orderItems.reduce(
      (sum: number, i: { price: number; quantity: number }) => sum + i.price * i.quantity,
      0
    );
    const shippingCost =
      deliveryType === 'SHIPPING' && subtotal < FREE_SHIPPING_THRESHOLD ? SHIPPING_COST : 0;
    const total = subtotal + shippingCost;

    const order = await Order.create({
      userId: session?.user?.id ? new mongoose.Types.ObjectId(session.user.id) : undefined,
      customerName,
      customerEmail,
      customerPhone,
      deliveryType,
      shippingAddress,
      shippingCity,
      shippingPostal,
      shippingCountry,
      notes,
      items: orderItems,
      subtotal,
      shippingCost,
      total,
      paymentStatus: 'PENDING',
      status: 'PENDING',
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    let stripeSession;
    try {
      stripeSession = await createCheckoutSession({
        orderId: (order._id as mongoose.Types.ObjectId).toString(),
        items: orderItems.map((i: { name: string; price: number; quantity: number; image?: string }) => ({
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          image: i.image,
        })),
        shippingCost,
        customerEmail,
        successUrl: `${siteUrl}/sucesso?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${siteUrl}/falha?order_id=${(order._id as mongoose.Types.ObjectId).toString()}`,
      });
    } catch (stripeErr) {
      // Clean up orphan order if Stripe session creation fails
      await Order.findByIdAndDelete(order._id);
      console.error('Stripe session creation failed:', stripeErr);
      return NextResponse.json({ error: 'Erro ao iniciar pagamento. Tente novamente.' }, { status: 502 });
    }

    order.stripePaymentId = stripeSession.id;
    await order.save();

    return NextResponse.json({ url: stripeSession.url });
  } catch (error) {
    console.error('Checkout error:', error);
    // Don't leak internal error details to the client
    const isUserError = error instanceof Error && (
      error.message.includes('não encontrado') ||
      error.message.includes('Stock insuficiente') ||
      error.message.includes('inválid')
    );
    return NextResponse.json(
      { error: isUserError ? (error as Error).message : 'Erro ao processar checkout' },
      { status: isUserError ? 400 : 500 }
    );
  }
}
