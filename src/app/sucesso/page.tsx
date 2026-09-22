import Link from 'next/link';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { botaoClasses } from '@/components/ui/Button';

export const metadata = { title: 'Pagamento concluído - Pétalas de Sonho' };

export default function SucessoPage() {
  return (
    <>
      <Header />
      <main className="container-custom py-20 text-center md:py-28">
        <h1 className="mb-4 font-serif text-3xl text-ink md:text-4xl">
          Pagamento concluído
        </h1>
        <p className="mx-auto mb-8 max-w-md text-ink-muted">
          Obrigado pela sua compra. Receberá um email de confirmação em breve.
        </p>
        <Link href="/loja" className={botaoClasses()}>
          Continuar a comprar
        </Link>
      </main>
      <Footer />
    </>
  );
}
