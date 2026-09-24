import Link from 'next/link';
import AdminHeader from '@/components/adminHeader';
import FormularioProduto from '@/components/admin/FormularioProduto';
import { Alert, Container, PageHeader } from '@/components/ui';
import { paginaDeAdmin } from '@/lib/autorizacao';
import { categoriasParaFormulario } from '../dados';

export const metadata = { title: 'Novo produto · Painel' };

export default async function NovoProdutoPage() {
  await paginaDeAdmin();
  const categorias = await categoriasParaFormulario();

  return (
    <>
      <AdminHeader />
      <main id="conteudo" className="py-10">
        <Container className="max-w-3xl">
          <PageHeader title="Novo produto" align="left" />
          <div className="mt-8">
            {categorias === null ? (
              <Alert tone="erro">Não foi possível ler a base de dados.</Alert>
            ) : categorias.length === 0 ? (
              <Alert tone="info">
                Antes de um produto, uma categoria: é ela que diz se as peças são únicas ou têm
                medidas.{' '}
                <Link href="/admin/categorias" className="underline underline-offset-2">
                  Criar uma categoria
                </Link>
                .
              </Alert>
            ) : (
              <FormularioProduto categorias={categorias} />
            )}
          </div>
        </Container>
      </main>
    </>
  );
}
