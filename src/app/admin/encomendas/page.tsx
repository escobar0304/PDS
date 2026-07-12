'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, LayoutGrid, ListOrdered, Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  total: number;
  status: string;
  paymentStatus: string;
  deliveryType: string;
  items: OrderItem[];
  createdAt: string;
  shippingAddress?: string;
  shippingCity?: string;
  notes?: string;
}

const statusMap: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
  PROCESSING: { label: 'A Processar', color: 'bg-blue-100 text-blue-800' },
  SHIPPED: { label: 'Enviado', color: 'bg-purple-100 text-purple-800' },
  READY_PICKUP: { label: 'Pronto', color: 'bg-green-100 text-green-800' },
  COMPLETED: { label: 'Concluído', color: 'bg-green-100 text-green-800' },
  CANCELLED: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
};

const STATUS_OPTIONS = ['PENDING', 'PROCESSING', 'SHIPPED', 'READY_PICKUP', 'COMPLETED', 'CANCELLED'];

export default function AdminEncomendas() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<Order | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') router.push('/');
  }, [status, session, router]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/admin/orders?${params}`);
      const data = await res.json();
      setOrders(data.orders || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session, page, statusFilter]);

  const updateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
        );
        if (selected?._id === orderId) setSelected((prev) => prev && { ...prev, status: newStatus });
      }
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
        <div className="loading" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <header className="bg-[#4a1e5c] text-white px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-serif">Pétalas de Sonho — Admin</h1>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/" className="hover:text-purple-200">Ver Loja</Link>
          <span className="text-purple-300">|</span>
          <span className="text-purple-200">{session?.user?.name}</span>
        </div>
      </header>

      <div className="flex">
        <aside className="w-56 bg-white border-r border-gray-200 min-h-[calc(100vh-60px)] p-4">
          <nav className="space-y-1">
            <Link href="/admin" className="flex items-center gap-3 px-4 py-3 text-[#6b6b6b] hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors">
              <LayoutGrid className="w-4 h-4" />Dashboard
            </Link>
            <Link href="/admin/produtos" className="flex items-center gap-3 px-4 py-3 text-[#6b6b6b] hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors">
              <Package className="w-4 h-4" />Produtos
            </Link>
            <Link href="/admin/encomendas" className="flex items-center gap-3 px-4 py-3 bg-[#4a1e5c] text-white rounded-lg text-sm font-medium">
              <ListOrdered className="w-4 h-4" />Encomendas
            </Link>
          </nav>
        </aside>

        <main className="flex-1 p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-serif text-[#4a1e5c]">
              Encomendas <span className="text-base font-normal text-[#6b6b6b]">({total})</span>
            </h2>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={() => { setStatusFilter(''); setPage(1); }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${!statusFilter ? 'bg-[#4a1e5c] text-white' : 'bg-white text-[#6b6b6b] hover:bg-gray-100 shadow-soft'}`}
            >
              Todas
            </button>
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${statusFilter === s ? 'bg-[#4a1e5c] text-white' : 'bg-white text-[#6b6b6b] hover:bg-gray-100 shadow-soft'}`}
              >
                {statusMap[s]?.label || s}
              </button>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Orders list */}
            <div className="lg:col-span-2">
              {loading ? (
                <div className="bg-white rounded-xl shadow-soft p-12 text-center">
                  <div className="loading mx-auto" />
                </div>
              ) : orders.length === 0 ? (
                <div className="bg-white rounded-xl shadow-soft p-12 text-center text-[#6b6b6b]">
                  Sem encomendas
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <button
                      key={order._id}
                      onClick={() => setSelected(order)}
                      className={`w-full bg-white rounded-xl shadow-soft p-4 text-left hover:shadow-medium transition-all ${selected?._id === order._id ? 'ring-2 ring-[#4a1e5c]' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs text-[#6b6b6b]">
                          #{order._id.slice(-6).toUpperCase()}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusMap[order.status]?.color || 'bg-gray-100'}`}>
                          {statusMap[order.status]?.label || order.status}
                        </span>
                      </div>
                      <p className="font-semibold text-[#2c2c2c]">{order.customerName}</p>
                      <p className="text-xs text-[#6b6b6b] mb-2">{order.customerEmail}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-[#6b6b6b]">
                          {new Date(order.createdAt).toLocaleDateString('pt-PT')}
                          {' · '}
                          {order.deliveryType === 'SHIPPING' ? '🚚 Envio' : '🏪 Loja'}
                        </span>
                        <span className="font-bold text-[#4a1e5c]">{order.total.toFixed(2)}€</span>
                      </div>
                    </button>
                  ))}

                  {/* Pagination */}
                  {pages > 1 && (
                    <div className="flex justify-center items-center gap-3 pt-4">
                      <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-40">
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-sm text-[#6b6b6b]">{page} / {pages}</span>
                      <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages} className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-40">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Order detail */}
            <div>
              {selected ? (
                <div className="bg-white rounded-xl shadow-soft p-5 sticky top-8">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b">
                    <h3 className="font-serif text-[#4a1e5c] text-lg">
                      #{selected._id.slice(-6).toUpperCase()}
                    </h3>
                    <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    <p><span className="text-[#6b6b6b]">Cliente:</span> <strong>{selected.customerName}</strong></p>
                    <p><span className="text-[#6b6b6b]">Email:</span> {selected.customerEmail}</p>
                    <p><span className="text-[#6b6b6b]">Telefone:</span> {selected.customerPhone}</p>
                    <p><span className="text-[#6b6b6b]">Entrega:</span> {selected.deliveryType === 'SHIPPING' ? `Envio — ${selected.shippingAddress || ''}, ${selected.shippingCity || ''}` : 'Levantamento em Loja'}</p>
                    {selected.notes && <p><span className="text-[#6b6b6b]">Notas:</span> {selected.notes}</p>}
                  </div>

                  <div className="mb-4 pb-4 border-b">
                    <h4 className="text-xs font-semibold text-[#6b6b6b] uppercase mb-2">Produtos</h4>
                    {selected.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm py-1">
                        <span>{item.quantity}× {item.name}</span>
                        <span className="text-[#4a1e5c] font-medium">{(item.price * item.quantity).toFixed(2)}€</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm font-bold pt-2 border-t mt-2">
                      <span>Total</span>
                      <span className="text-[#4a1e5c]">{selected.total.toFixed(2)}€</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-[#6b6b6b] uppercase mb-2">Alterar Estado</h4>
                    <select
                      value={selected.status}
                      onChange={(e) => updateStatus(selected._id, e.target.value)}
                      disabled={updatingStatus}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a1e5c]"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{statusMap[s]?.label || s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-soft p-8 text-center text-[#6b6b6b]">
                  <Search className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">Selecione uma encomenda para ver detalhes</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
