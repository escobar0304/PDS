'use client';

import { Suspense } from 'react';
import Spinner from '@/components/ui/Spinner';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/header';
import Footer from '@/components/footer';
import Link from 'next/link';
import { XCircle, ArrowLeft, LifeBuoy } from 'lucide-react';

function FalhaContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#faf8f5] py-12 md:py-20">
        <div className="container-custom max-w-lg mx-auto px-4 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-red-500" />
          </div>

          <h1 className="text-3xl md:text-4xl font-serif text-[#4a1e5c] mb-3">
            Pagamento não concluído
          </h1>
          <p className="text-lg text-[#6b6b6b] mb-2">
            O pagamento foi cancelado ou ocorreu um erro. Nenhum valor foi cobrado.
          </p>
          {orderId && (
            <p className="text-sm text-[#6b6b6b] mb-8">
              Referência: #{orderId.slice(-6).toUpperCase()}
            </p>
          )}

          <div className="bg-white rounded-xl shadow-soft p-6 mb-8 text-left space-y-3">
            <h2 className="font-serif text-[#4a1e5c] text-lg mb-4">O que pode fazer</h2>
            <div className="flex items-start gap-3 text-sm text-[#6b6b6b]">
              <span className="text-[#4a1e5c] font-bold">1.</span>
              <span>Verifique os dados do cartão e tente novamente.</span>
            </div>
            <div className="flex items-start gap-3 text-sm text-[#6b6b6b]">
              <span className="text-[#4a1e5c] font-bold">2.</span>
              <span>Certifique-se de que tem saldo suficiente.</span>
            </div>
            <div className="flex items-start gap-3 text-sm text-[#6b6b6b]">
              <span className="text-[#4a1e5c] font-bold">3.</span>
              <span>Se o problema persistir, contacte o seu banco ou entre em contacto connosco.</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/carrinho" className="btn-primary inline-flex items-center justify-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Carrinho
            </Link>
            <Link href="/sobre-nos" className="btn-secondary inline-flex items-center justify-center gap-2">
              <LifeBuoy className="w-4 h-4" />
              Contactar Suporte
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function FalhaPage() {
  return (
    <Suspense
      fallback={
        <>
          <Header />
          <main className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
            <Spinner size={36} className="text-[#4a1e5c]" />
          </main>
          <Footer />
        </>
      }
    >
      <FalhaContent />
    </Suspense>
  );
}
