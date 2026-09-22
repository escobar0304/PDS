import Link from 'next/link';
import AdminHeader from '@/components/adminHeader';

export const metadata = { title: 'Admin - Pétalas de Sonho' };

export default function AdminPage() {
  return (
    <>
      <AdminHeader />
      <main className="container-custom py-12">
        <h1 className="text-2xl font-semibold text-white mb-4">Administração</h1>
        <p className="text-gray-400 mb-6">
          Esta área ainda não está construída.
        </p>
        <ul className="space-y-2">
          <li>
            <Link href="/admin/produtos" className="text-gray-300 hover:text-white transition-smooth">
              Produtos
            </Link>
          </li>
          <li>
            <Link href="/admin/encomendas" className="text-gray-300 hover:text-white transition-smooth">
              Encomendas
            </Link>
          </li>
        </ul>
      </main>
    </>
  );
}
