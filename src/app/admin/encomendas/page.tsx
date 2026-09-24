import AdminHeader from '@/components/adminHeader';
import { paginaDeAdmin } from '@/lib/autorizacao';

export const metadata = { title: 'Encomendas - Admin' };

export default async function AdminEncomendasPage() {
  await paginaDeAdmin();

  return (
    <>
      <AdminHeader />
      <main id="conteudo" className="container-custom py-12">
        <h1 className="text-2xl font-semibold text-surface mb-4">Encomendas</h1>
        <p className="text-rose-200">
          Gestão de encomendas por construir.
        </p>
      </main>
    </>
  );
}
