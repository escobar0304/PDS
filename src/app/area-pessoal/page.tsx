'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { User, Package, Heart, LogOut, Settings, CheckCircle } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';
import { apiFetch, ApiError } from '@/lib/api';
import Link from 'next/link';

interface Order {
  _id: string;
  createdAt: string;
  total: number;
  status: string;
  deliveryType: string;
  items: Array<{ name: string; quantity: number; price: number }>;
}

interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
}

const statusMap: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
  PROCESSING: { label: 'A Processar', color: 'bg-blue-100 text-blue-800' },
  SHIPPED: { label: 'Enviado', color: 'bg-purple-100 text-purple-800' },
  READY_PICKUP: { label: 'Pronto p/ Levantamento', color: 'bg-green-100 text-green-800' },
  COMPLETED: { label: 'Concluído', color: 'bg-green-100 text-green-800' },
  CANCELLED: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
};

export default function AreaPessoal() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'perfil' | 'encomendas' | 'favoritos'>('perfil');
  const [orders, setOrders] = useState<Order[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileForm, setProfileForm] = useState<UserProfile>({ name: '', email: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/area-pessoal');
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;

    const fetchProfile = async () => {
      try {
        const data = await apiFetch<UserProfile>('/api/user/profile');
        setProfile(data);
        setProfileForm({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
          city: data.city || '',
          postalCode: data.postalCode || '',
          country: data.country || 'Portugal',
        });
      } catch {
        // perfil não carregou — form fica vazio mas não bloqueia a página
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [status]);

  useEffect(() => {
    if (status !== 'authenticated' || activeTab !== 'encomendas') return;

    const fetchOrders = async () => {
      try {
        const data = await apiFetch<Order[]>('/api/orders');
        setOrders(Array.isArray(data) ? data : []);
      } catch {
        setOrders([]);
      }
    };

    fetchOrders();
  }, [status, activeTab]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setSaveError('');

    try {
      const data = await apiFetch<UserProfile>('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm),
      });
      setProfile(data);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Erro de ligação');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  if (status === 'loading' || loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-[#faf8f5] py-12 flex items-center justify-center">
          <Spinner size={36} className="text-[#4a1e5c]" />
        </main>
        <Footer />
      </>
    );
  }

  if (!session) return null;

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#faf8f5] py-8 md:py-12">
        <div className="container-custom">
          <h1 className="text-3xl md:text-4xl font-serif text-[#4a1e5c] mb-8">Área Pessoal</h1>

          <div className="grid lg:grid-cols-4 gap-6 md:gap-8">
            {/* Sidebar */}
            <aside className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-soft p-4 space-y-2">
                <button
                  onClick={() => setActiveTab('perfil')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-smooth ${activeTab === 'perfil' ? 'bg-[#4a1e5c] text-white' : 'text-[#6b6b6b] hover:bg-gray-100'}`}
                >
                  <User className="w-5 h-5" />
                  <span className="font-medium">Perfil</span>
                </button>

                <button
                  onClick={() => setActiveTab('encomendas')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-smooth ${activeTab === 'encomendas' ? 'bg-[#4a1e5c] text-white' : 'text-[#6b6b6b] hover:bg-gray-100'}`}
                >
                  <Package className="w-5 h-5" />
                  <span className="font-medium">Encomendas</span>
                </button>

                <button
                  onClick={() => setActiveTab('favoritos')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-smooth ${activeTab === 'favoritos' ? 'bg-[#4a1e5c] text-white' : 'text-[#6b6b6b] hover:bg-gray-100'}`}
                >
                  <Heart className="w-5 h-5" />
                  <span className="font-medium">Favoritos</span>
                </button>

                {session.user.role === 'ADMIN' && (
                  <Link
                    href="/admin"
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[#4a1e5c] bg-purple-50 hover:bg-purple-100 transition-smooth font-medium"
                  >
                    <Settings className="w-5 h-5" />
                    <span>Admin</span>
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-smooth"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Sair</span>
                </button>
              </div>
            </aside>

            {/* Conteúdo */}
            <div className="lg:col-span-3">
              {/* Perfil */}
              {activeTab === 'perfil' && (
                <div className="bg-white rounded-lg shadow-soft p-6 md:p-8">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-serif text-[#4a1e5c]">Informações Pessoais</h2>
                  </div>

                  <form onSubmit={handleSaveProfile} className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#2c2c2c] mb-2">Nome Completo</label>
                        <input
                          type="text"
                          name="name"
                          value={profileForm.name}
                          onChange={handleProfileChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4a1e5c]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#2c2c2c] mb-2">Email</label>
                        <input
                          type="email"
                          name="email"
                          value={profileForm.email}
                          disabled
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-[#6b6b6b] cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#2c2c2c] mb-2">Telefone</label>
                        <input
                          type="tel"
                          name="phone"
                          value={profileForm.phone || ''}
                          onChange={handleProfileChange}
                          placeholder="+351 912 345 678"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4a1e5c]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#2c2c2c] mb-2">Código Postal</label>
                        <input
                          type="text"
                          name="postalCode"
                          value={profileForm.postalCode || ''}
                          onChange={handleProfileChange}
                          placeholder="4000-000"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4a1e5c]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#2c2c2c] mb-2">Morada</label>
                      <input
                        type="text"
                        name="address"
                        value={profileForm.address || ''}
                        onChange={handleProfileChange}
                        placeholder="Rua, número, andar"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4a1e5c]"
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#2c2c2c] mb-2">Cidade</label>
                        <input
                          type="text"
                          name="city"
                          value={profileForm.city || ''}
                          onChange={handleProfileChange}
                          placeholder="Porto"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4a1e5c]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#2c2c2c] mb-2">País</label>
                        <input
                          type="text"
                          name="country"
                          value={profileForm.country || 'Portugal'}
                          onChange={handleProfileChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4a1e5c]"
                        />
                      </div>
                    </div>

                    {saveSuccess && (
                      <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                        <CheckCircle className="w-4 h-4" />
                        Alterações guardadas com sucesso!
                      </div>
                    )}
                    {saveError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                        {saveError}
                      </div>
                    )}

                    <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
                      {saving ? 'A guardar...' : 'Guardar Alterações'}
                    </button>
                  </form>
                </div>
              )}

              {/* Encomendas */}
              {activeTab === 'encomendas' && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-serif text-[#4a1e5c] mb-6">Histórico de Encomendas</h2>

                  {orders.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-soft p-12 text-center">
                      <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                      <p className="text-lg text-[#6b6b6b]">Ainda não fez nenhuma encomenda</p>
                      <Link href="/loja" className="btn-primary inline-block mt-6">
                        Ir às Compras
                      </Link>
                    </div>
                  ) : (
                    orders.map((order) => (
                      <div key={order._id} className="bg-white rounded-lg shadow-soft p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 pb-4 border-b">
                          <div>
                            <p className="font-medium text-[#2c2c2c]">
                              Encomenda #{order._id.slice(-6).toUpperCase()}
                            </p>
                            <p className="text-sm text-[#6b6b6b]">
                              {new Date(order.createdAt).toLocaleDateString('pt-PT')}
                              {' · '}
                              {order.deliveryType === 'SHIPPING' ? '🚚 Envio' : '🏪 Levantamento'}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusMap[order.status]?.color || 'bg-gray-100'}`}>
                            {statusMap[order.status]?.label || order.status}
                          </span>
                        </div>

                        <div className="space-y-2 mb-4">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span className="text-[#2c2c2c]">{item.quantity}× {item.name}</span>
                              <span className="font-medium text-[#4a1e5c]">
                                {(item.price * item.quantity).toFixed(2)}€
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t">
                          <span className="text-lg font-semibold text-[#2c2c2c]">Total</span>
                          <span className="text-2xl font-bold text-[#4a1e5c]">{order.total.toFixed(2)}€</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Favoritos */}
              {activeTab === 'favoritos' && (
                <div className="bg-white rounded-lg shadow-soft p-12 text-center">
                  <Heart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h2 className="text-2xl font-serif text-[#4a1e5c] mb-2">Lista de Favoritos</h2>
                  <p className="text-lg text-[#6b6b6b] mb-6">
                    Ainda não adicionou produtos aos favoritos
                  </p>
                  <Link href="/loja" className="btn-primary inline-block">
                    Explorar Produtos
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
