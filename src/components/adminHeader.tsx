import Link from 'next/link';

/**
 * O cabecalho do painel. Sem `<h1>`: cada pagina tem o seu, e dois por
 * pagina era o que havia antes.
 */
export default function AdminHeader() {
  return (
    <header className="on-plum bg-plum text-surface">
      <div className="container-custom flex flex-wrap items-center justify-between gap-4 py-4">
        <Link href="/admin" className="font-serif text-lg transition-smooth hover:text-rose-200">
          Painel · Pétalas de Sonho
        </Link>
        <nav aria-label="Painel" className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Link href="/admin/produtos" className="py-1 transition-smooth hover:text-rose-200">
            Produtos
          </Link>
          <Link href="/admin/categorias" className="py-1 transition-smooth hover:text-rose-200">
            Categorias
          </Link>
          <Link href="/" className="py-1 transition-smooth hover:text-rose-200">
            Ver a loja
          </Link>
        </nav>
      </div>
    </header>
  );
}
