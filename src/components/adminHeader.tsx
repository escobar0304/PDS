import Link from 'next/link';

export default function AdminHeader() {
  return (
    <header className="on-plum flex justify-between bg-plum p-4 text-surface">
      <h1 className="font-bold">Admin - Pétalas de Sonho</h1>
      <nav className="space-x-4">
        <Link href="/admin/produtos" className="transition-smooth hover:text-rose-200">Produtos</Link>
        <Link href="/admin/encomendas" className="transition-smooth hover:text-rose-200">Encomendas</Link>
      </nav>
    </header>
  );
}
