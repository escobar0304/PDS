import Link from 'next/link';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { botaoClasses } from '@/components/ui/Button';

export const metadata = { title: 'Pagamento não concluído - Pétalas de Sonho' };

export default function FalhaPage() {
  return (
    <>
      <Header />
      <main className="container-custom py-20 text-center md:py-28">
        <h1 className="mb-4 font-serif text-3xl text-ink md:text-4xl">
          Pagamento falhou ou foi cancelado
        </h1>
        <p className="mx-auto mb-8 max-w-md text-ink-muted">
          Nada foi cobrado. Pode tentar novamente ou falar connosco.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/carrinho" className={botaoClasses()}>
            Voltar ao carrinho
          </Link>
          <Link href="/sobre-nos" className={botaoClasses({ variant: 'secondary' })}>
            Falar connosco
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
