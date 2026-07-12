import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import connectDB from '@/lib/db';
import { Order, Product, User, Category } from '@/lib/models';

export async function GET() {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    await connectDB();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalOrders,
      pendingOrders,
      monthOrders,
      totalProducts,
      totalUsers,
      totalCategories,
      revenueAgg,
      monthRevenueAgg,
      recentOrders,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: { $in: ['PENDING', 'PROCESSING'] } }),
      Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Product.countDocuments({ active: true }),
      User.countDocuments(),
      Category.countDocuments(),
      Order.aggregate([
        { $match: { paymentStatus: 'PAID' } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Order.aggregate([
        { $match: { paymentStatus: 'PAID', createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Order.find().sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    return NextResponse.json({
      totalOrders,
      pendingOrders,
      monthOrders,
      totalProducts,
      totalUsers,
      totalCategories,
      totalRevenue: revenueAgg[0]?.total || 0,
      monthRevenue: monthRevenueAgg[0]?.total || 0,
      recentOrders,
    });
  } catch (error) {
    console.error('Erro ao buscar stats:', error);
    return NextResponse.json({ error: 'Erro ao buscar stats' }, { status: 500 });
  }
}
