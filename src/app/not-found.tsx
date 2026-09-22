import Link from 'next/link';

export const metadata = { title: 'Página não encontrada - Pétalas de Sonho' };

// Provisorio. Ganha o tratamento visual definitivo na F10 do roteiro.
export default function NotFound() {
  return (
    <main className="container-custom flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <h1 className="mb-4 font-serif text-3xl text-ink md:text-4xl">
        Não encontrámos esta página
      </h1>
      <p className="mb-8 max-w-md text-ink-muted">
        A ligação pode estar errada ou a página pode ter mudado de sítio.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn-primary">
          Voltar ao início
        </Link>
        <Link href="/loja" className="btn-secondary">
          Ver a loja
        </Link>
      </div>
    </main>
  );
}
