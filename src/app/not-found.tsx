import Link from 'next/link';

export const metadata = { title: 'Página não encontrada - Pétalas de Sonho' };

// Provisorio. Ganha o tratamento visual definitivo na F10 do roteiro.
export default function NotFound() {
  return (
    <main className="container-custom flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <h1 className="mb-4 text-3xl font-serif text-white md:text-4xl">
        Não encontrámos esta página
      </h1>
      <p className="mb-8 max-w-md text-gray-400">
        A ligação pode estar errada ou a página pode ter mudado de sítio.
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <Link href="/" className="btn-primary">
          Voltar ao início
        </Link>
        <Link
          href="/loja"
          className="inline-block rounded-full border-2 border-white/60 px-8 py-4 font-semibold text-white transition-smooth hover:bg-white hover:text-[#000414]"
        >
          Ver a loja
        </Link>
      </div>
    </main>
  );
}
