'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShoppingBag,
  Package,
  Users,
  TrendingUp,
  Clock,
  ChevronRight,
  LayoutGrid,
  ListOrdered,
} from 'lucide-react';

interface Stats {
  totalOrders: number;
  pendingOrders: number;
  monthOrders: number;
  totalProducts: number;
  totalUsers: number;
  totalCategories: number;
  totalRevenue: number;
  monthRevenue: number;
  recentOrders: Array<{
    _id: string;
    customerName: string;
    total: number;
    status: string;
    createdAt: string;
  }>;
}

const statusMap: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
  PROCESSING: { label: 'A Processar', color: 'bg-blue-100 text-blue-800' },
  SHIPPED: { label: 'Enviado', color: 'bg-purple-100 text-purple-800' },
  READY_PICKUP: { label: 'Pronto', color: 'bg-green-100 text-green-800' },
  COMPLETED: { label: 'Concluído', color: 'bg-green-100 text-green-800' },
  CANCELLED: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
};

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
    if (status === 'authenticated' && session.user.role !== 'ADMIN') router.push('/');
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      fetch('/api/admin/stats')
        .then((r) => r.json())
        .then(setStats)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [status, session]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
        <div className="loading" />
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      label: 'Receita Total',
      value: `${stats.totalRevenue.toFixed(2)}€`,
      sub: `+${stats.monthRevenue.toFixed(2)}€ este mês`,
      icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Encomendas',
      value: stats.totalOrders,
      sub: `${stats.monthOrders} este mês`,
      icon: ShoppingBag,
      color: 'text-[#4a1e5c]',
      bg: 'bg-purple-50',
    },
    {
      label: 'Pendentes',
      value: stats.pendingOrders,
      sub: 'a aguardar processamento',
      icon: Clock,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      label: 'Produtos',
      value: stats.totalProducts,
      sub: `${stats.totalCategories} categorias`,
      icon: Package,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Clientes',
      value: stats.totalUsers,
      sub: 'utilizadores registados',
      icon: Users,
      color: 'text-pink-600',
      bg: 'bg-pink-50',
    },
  ];

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      {/* Admin Top Bar */}
      <header className="bg-[#4a1e5c] text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-serif">Pétalas de Sonho — Admin</h1>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/" className="hover:text-purple-200 transition-colors">
            Ver Loja
          </Link>
          <span className="text-purple-300">|</span>
          <span className="text-purple-200">{session?.user?.name}</span>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-56 bg-white border-r border-gray-200 min-h-[calc(100vh-60px)] p-4">
          <nav className="space-y-1">
            <Link
              href="/admin"
              className="flex items-center gap-3 px-4 py-3 bg-[#4a1e5c] text-white rounded-lg text-sm font-medium"
            >
              <LayoutGrid className="w-4 h-4" />
              Dashboard
            </Link>
            <Link
              href="/admin/produtos"
              className="flex items-center gap-3 px-4 py-3 text-[#6b6b6b] hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
            >
              <Package className="w-4 h-4" />
              Produtos
            </Link>
            <Link
              href="/admin/encomendas"
              className="flex items-center gap-3 px-4 py-3 text-[#6b6b6b] hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
            >
              <ListOrdered className="w-4 h-4" />
              Encomendas
            </Link>
          </nav>
        </aside>

        {/* Main */}
        <main className="flex-1 p-6 md:p-8">
          <h2 className="text-2xl font-serif text-[#4a1e5c] mb-8">Dashboard</h2>

          {/* Stat Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
            {statCards.map((card) => (
              <div key={card.label} className="bg-white rounded-xl shadow-soft p-5">
                <div className={`w-10 h-10 ${card.bg} rounded-lg flex items-center justify-center mb-3`}>
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <p className="text-2xl font-bold text-[#2c2c2c]">{card.value}</p>
                <p className="text-sm font-medium text-[#2c2c2c] mt-1">{card.label}</p>
                <p className="text-xs text-[#6b6b6b] mt-0.5">{card.sub}</p>
              </div>
            ))}
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-xl shadow-soft p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-serif text-[#4a1e5c]">Encomendas Recentes</h3>
              <Link
                href="/admin/encomendas"
                className="text-sm text-[#4a1e5c] hover:underline flex items-center gap-1"
              >
                Ver todas <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {stats.recentOrders.length === 0 ? (
              <p className="text-[#6b6b6b] text-sm text-center py-8">Sem encomendas ainda</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-2 text-[#6b6b6b] font-medium">Ref.</th>
                      <th className="text-left py-3 px-2 text-[#6b6b6b] font-medium">Cliente</th>
                      <th className="text-left py-3 px-2 text-[#6b6b6b] font-medium">Data</th>
                      <th className="text-right py-3 px-2 text-[#6b6b6b] font-medium">Total</th>
                      <th className="text-center py-3 px-2 text-[#6b6b6b] font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentOrders.map((order) => (
                      <tr key={order._id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-3 px-2 font-mono text-xs text-[#6b6b6b]">
                          #{order._id.slice(-6).toUpperCase()}
                        </td>
                        <td className="py-3 px-2 font-medium text-[#2c2c2c]">{order.customerName}</td>
                        <td className="py-3 px-2 text-[#6b6b6b]">
                          {new Date(order.createdAt).toLocaleDateString('pt-PT')}
                        </td>
                        <td className="py-3 px-2 text-right font-semibold text-[#4a1e5c]">
                          {order.total.toFixed(2)}€
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              statusMap[order.status]?.color || 'bg-gray-100'
                            }`}
                          >
                            {statusMap[order.status]?.label || order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
