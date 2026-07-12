'use client';

import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import Header from '@/components/header';
import Footer from '@/components/footer';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Truck, Store, Lock, ChevronRight } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const SHIPPING_COST = 4.5;
const FREE_SHIPPING_THRESHOLD = 50;

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const { data: session } = useSession();
  const router = useRouter();

  const [deliveryType, setDeliveryType] = useState<'SHIPPING' | 'PICKUP'>('SHIPPING');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    customerName: session?.user?.name || '',
    customerEmail: session?.user?.email || '',
    customerPhone: '',
    shippingAddress: '',
    shippingCity: '',
    shippingPostal: '',
    shippingCountry: 'Portugal',
    notes: '',
  });

  const shippingCost =
    deliveryType === 'SHIPPING' && total < FREE_SHIPPING_THRESHOLD ? SHIPPING_COST : 0;
  const orderTotal = total + shippingCost;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({ _id: i._id, quantity: i.quantity })),
          deliveryType,
          ...form,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erro ao processar checkout');
        return;
      }

      clearCart();
      window.location.href = data.url;
    } catch {
      setError('Erro de ligação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-[#faf8f5] py-12">
          <div className="container-custom text-center py-16">
            <h1 className="text-3xl font-serif text-[#4a1e5c] mb-4">Carrinho Vazio</h1>
            <Link href="/loja" className="btn-primary inline-block">
              Ir às Compras
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#faf8f5] py-8 md:py-12">
        <div className="container-custom">
          <Link
            href="/carrinho"
            className="inline-flex items-center gap-2 text-sm text-[#6b6b6b] hover:text-[#4a1e5c] transition-smooth mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Carrinho
          </Link>

          <h1 className="text-3xl md:text-4xl font-serif text-[#4a1e5c] mb-8">Finalizar Compra</h1>

          <form onSubmit={handleSubmit}>
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Formulário */}
              <div className="lg:col-span-2 space-y-6">
                {/* Dados Pessoais */}
                <div className="bg-white rounded-xl shadow-soft p-6 md:p-8">
                  <h2 className="text-xl font-serif text-[#4a1e5c] mb-6">Dados Pessoais</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#2c2c2c] mb-2">
                        Nome Completo <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="customerName"
                        value={form.customerName}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4a1e5c] transition-smooth"
                        placeholder="Nome completo"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#2c2c2c] mb-2">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="customerEmail"
                        value={form.customerEmail}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4a1e5c] transition-smooth"
                        placeholder="email@exemplo.pt"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-[#2c2c2c] mb-2">
                        Telefone <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="customerPhone"
                        value={form.customerPhone}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4a1e5c] transition-smooth"
                        placeholder="+351 912 345 678"
                      />
                    </div>
                  </div>
                </div>

                {/* Tipo de Entrega */}
                <div className="bg-white rounded-xl shadow-soft p-6 md:p-8">
                  <h2 className="text-xl font-serif text-[#4a1e5c] mb-6">Tipo de Entrega</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setDeliveryType('SHIPPING')}
                      className={`flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                        deliveryType === 'SHIPPING'
                          ? 'border-[#4a1e5c] bg-purple-50'
                          : 'border-gray-200 hover:border-purple-200'
                      }`}
                    >
                      <div
                        className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          deliveryType === 'SHIPPING' ? 'border-[#4a1e5c]' : 'border-gray-300'
                        }`}
                      >
                        {deliveryType === 'SHIPPING' && (
                          <div className="w-2.5 h-2.5 rounded-full bg-[#4a1e5c]" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Truck className="w-4 h-4 text-[#4a1e5c]" />
                          <span className="font-semibold text-[#2c2c2c]">Envio a Domicílio</span>
                        </div>
                        <p className="text-sm text-[#6b6b6b]">
                          {total >= FREE_SHIPPING_THRESHOLD
                            ? 'Envio gratuito'
                            : `${SHIPPING_COST.toFixed(2)}€ — Grátis acima de ${FREE_SHIPPING_THRESHOLD}€`}
                        </p>
                        <p className="text-xs text-[#6b6b6b] mt-1">2-3 dias úteis</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeliveryType('PICKUP')}
                      className={`flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                        deliveryType === 'PICKUP'
                          ? 'border-[#4a1e5c] bg-purple-50'
                          : 'border-gray-200 hover:border-purple-200'
                      }`}
                    >
                      <div
                        className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          deliveryType === 'PICKUP' ? 'border-[#4a1e5c]' : 'border-gray-300'
                        }`}
                      >
                        {deliveryType === 'PICKUP' && (
                          <div className="w-2.5 h-2.5 rounded-full bg-[#4a1e5c]" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Store className="w-4 h-4 text-[#4a1e5c]" />
                          <span className="font-semibold text-[#2c2c2c]">Levantamento em Loja</span>
                        </div>
                        <p className="text-sm text-[#6b6b6b]">Gratuito — Levante na nossa loja</p>
                        <p className="text-xs text-[#6b6b6b] mt-1">Notificamos quando pronto</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Morada de Entrega */}
                {deliveryType === 'SHIPPING' && (
                  <div className="bg-white rounded-xl shadow-soft p-6 md:p-8">
                    <h2 className="text-xl font-serif text-[#4a1e5c] mb-6">Morada de Entrega</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-[#2c2c2c] mb-2">
                          Morada <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="shippingAddress"
                          value={form.shippingAddress}
                          onChange={handleChange}
                          required={deliveryType === 'SHIPPING'}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4a1e5c] transition-smooth"
                          placeholder="Rua, número, andar"
                        />
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-[#2c2c2c] mb-2">
                            Cidade <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="shippingCity"
                            value={form.shippingCity}
                            onChange={handleChange}
                            required={deliveryType === 'SHIPPING'}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4a1e5c] transition-smooth"
                            placeholder="Porto"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#2c2c2c] mb-2">
                            Código Postal <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="shippingPostal"
                            value={form.shippingPostal}
                            onChange={handleChange}
                            required={deliveryType === 'SHIPPING'}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4a1e5c] transition-smooth"
                            placeholder="4000-000"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#2c2c2c] mb-2">País</label>
                        <select
                          name="shippingCountry"
                          value={form.shippingCountry}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4a1e5c] transition-smooth"
                        >
                          <option value="Portugal">Portugal</option>
                          <option value="Espanha">Espanha</option>
                          <option value="Brasil">Brasil</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notas */}
                <div className="bg-white rounded-xl shadow-soft p-6 md:p-8">
                  <h2 className="text-xl font-serif text-[#4a1e5c] mb-4">Notas (opcional)</h2>
                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4a1e5c] transition-smooth resize-none"
                    placeholder="Instruções especiais para entrega ou encomenda..."
                  />
                </div>
              </div>

              {/* Resumo */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-soft p-6 sticky top-24">
                  <h2 className="text-xl font-serif text-[#4a1e5c] mb-6">Resumo</h2>

                  <div className="space-y-3 mb-4">
                    {items.map((item) => (
                      <div key={item._id} className="flex gap-3 items-center">
                        <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                          <Image
                            src={item.image || '/images/placeholder.jpg'}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#2c2c2c] truncate">{item.name}</p>
                          <p className="text-xs text-[#6b6b6b]">Qtd: {item.quantity}</p>
                        </div>
                        <span className="text-sm font-semibold text-[#4a1e5c]">
                          {(item.price * item.quantity).toFixed(2)}€
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4 space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#6b6b6b]">Subtotal</span>
                      <span className="font-medium">{total.toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#6b6b6b]">Envio</span>
                      <span className={shippingCost === 0 ? 'text-green-600 font-medium' : 'font-medium'}>
                        {shippingCost === 0 ? 'Grátis' : `${shippingCost.toFixed(2)}€`}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-t pt-4 mb-6">
                    <span className="text-lg font-semibold text-[#2c2c2c]">Total</span>
                    <span className="text-2xl font-bold text-[#4a1e5c]">{orderTotal.toFixed(2)}€</span>
                  </div>

                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <span className="animate-spin">⏳</span> A processar...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        Pagar {orderTotal.toFixed(2)}€
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[#6b6b6b]">
                    <Lock className="w-3 h-3" />
                    <span>Pagamento seguro via Stripe</span>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
