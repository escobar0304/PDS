import AdminHeader from '@/components/adminHeader';

export const metadata = { title: 'Produtos - Admin' };

export default function AdminProdutosPage() {
  return (
    <>
      <AdminHeader />
      <main className="container-custom py-12">
        <h1 className="text-2xl font-semibold text-white mb-4">Produtos</h1>
        <p className="text-gray-400">
          Gestão de produtos por construir.
        </p>
      </main>
    </>
  );
}
