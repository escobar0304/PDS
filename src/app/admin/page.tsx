import Link from 'next/link';
import AdminHeader from '@/components/adminHeader';

export const metadata = { title: 'Admin - Pétalas de Sonho' };

export default function AdminPage() {
  return (
    <>
      <AdminHeader />
      <main className="container-custom py-12">
        <h1 className="text-2xl font-semibold text-surface mb-4">Administração</h1>
        <p className="text-rose-200 mb-6">
          Esta área ainda não está construída.
        </p>
        <ul className="space-y-2">
          <li>
            <Link href="/admin/produtos" className="text-rose-200 hover:text-surface transition-smooth">
              Produtos
            </Link>
          </li>
          <li>
            <Link href="/admin/encomendas" className="text-rose-200 hover:text-surface transition-smooth">
              Encomendas
            </Link>
          </li>
        </ul>
      </main>
    </>
  );
}
