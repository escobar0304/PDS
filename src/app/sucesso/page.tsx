'use client';

import { useEffect, useState, Suspense } from 'react';
import Spinner from '@/components/ui/Spinner';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/header';
import Footer from '@/components/footer';
import Link from 'next/link';
import { CheckCircle, Package, Mail, ArrowRight } from 'lucide-react';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface OrderData {
  _id: string;
  customerName: string;
  customerEmail: string;
  total: number;
  deliveryType: string;
  status: string;
  items: OrderItem[];
  createdAt: string;
}

function SucessoContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/by-session?session_id=${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data);
        }
      } catch {
        // silently fail — confirmation page still shows without order details
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [sessionId]);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#faf8f5] py-12 md:py-20">
        <div className="container-custom max-w-2xl mx-auto px-4">
          {/* Success Header */}
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-serif text-[#4a1e5c] mb-3">
              Encomenda Confirmada!
            </h1>
            <p className="text-lg text-[#6b6b6b]">
              Obrigado pela sua compra. Receberá um email de confirmação em breve.
            </p>
          </div>

          {/* Order Summary */}
          {!loading && order && (
            <div className="bg-white rounded-xl shadow-soft p-6 md:p-8 mb-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b">
                <Package className="w-5 h-5 text-[#4a1e5c]" />
                <h2 className="text-lg font-serif text-[#4a1e5c]">
                  Referência #{order._id.slice(-6).toUpperCase()}
                </h2>
              </div>

              <div className="space-y-3 mb-6">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-[#2c2c2c]">
                      {item.quantity}× {item.name}
                    </span>
                    <span className="font-medium text-[#4a1e5c]">
                      {(item.price * item.quantity).toFixed(2)}€
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <span className="font-semibold text-[#2c2c2c]">Total pago</span>
                <span className="text-2xl font-bold text-[#4a1e5c]">{order.total.toFixed(2)}€</span>
              </div>

              <div className="mt-6 pt-4 border-t space-y-2 text-sm text-[#6b6b6b]">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>Confirmação enviada para {order.customerEmail}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  <span>
                    {order.deliveryType === 'SHIPPING'
                      ? 'Envio em 2-3 dias úteis'
                      : 'Notificamos quando estiver pronto para levantamento'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {!loading && !order && (
            <div className="bg-white rounded-xl shadow-soft p-6 mb-6 text-center text-[#6b6b6b]">
              <p>O seu pagamento foi processado com sucesso.</p>
              <p className="text-sm mt-1">Receberá um email de confirmação em breve.</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/area-pessoal" className="btn-primary inline-flex items-center justify-center gap-2">
              <Package className="w-4 h-4" />
              Ver Encomendas
            </Link>
            <Link href="/loja" className="btn-secondary inline-flex items-center justify-center gap-2">
              Continuar a Comprar
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function SucessoPage() {
  return (
    <Suspense fallback={
      <>
        <Header />
        <main className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
          <Spinner size={36} className="text-[#4a1e5c]" />
        </main>
        <Footer />
      </>
    }>
      <SucessoContent />
    </Suspense>
  );
}
