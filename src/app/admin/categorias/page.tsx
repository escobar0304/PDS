import AdminHeader from '@/components/adminHeader';
import FormularioCategoria from '@/components/admin/FormularioCategoria';
import { Alert, Card, Container, PageHeader } from '@/components/ui';
import { paginaDeAdmin } from '@/lib/autorizacao';
import connectDB from '@/lib/db';
import { Category } from '@/lib/models';

export const metadata = { title: 'Categorias · Painel' };

async function ler() {
  try {
    await connectDB();
    return await Category.find().sort({ order: 1, name: 1 }).lean();
  } catch (erro) {
    console.error('Painel: categorias indisponíveis:', erro);
    return null;
  }
}

export default async function AdminCategoriasPage() {
  await paginaDeAdmin();
  const categorias = await ler();

  return (
    <>
      <AdminHeader />
      <main id="conteudo" className="py-10">
        <Container className="max-w-3xl">
          <PageHeader
            title="Categorias"
            lead="É a categoria que diz se as peças são únicas ou têm medidas."
            align="left"
          />

          <Card className="mt-8 p-5">
            <h2 className="mb-4 font-serif text-xl text-rose-700">Nova categoria</h2>
            <FormularioCategoria />
          </Card>

          <h2 className="mb-4 mt-10 font-serif text-2xl text-rose-700">As que existem</h2>
          {categorias === null ? (
            <Alert tone="erro">Não foi possível ler a base de dados.</Alert>
          ) : categorias.length === 0 ? (
            <p className="text-sm text-ink-muted">Ainda não há categorias.</p>
          ) : (
            <ul className="space-y-4">
              {categorias.map((c) => (
                <li key={String(c._id)}>
                  <Card className="p-5">
                    <FormularioCategoria
                      inicial={{
                        id: String(c._id),
                        name: c.name,
                        slug: c.slug,
                        pecasUnicas: c.pecasUnicas ?? false,
                      }}
                    />
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </Container>
      </main>
    </>
  );
}
