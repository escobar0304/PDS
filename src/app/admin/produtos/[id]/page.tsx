import mongoose from 'mongoose';
import { notFound } from 'next/navigation';
import AdminHeader from '@/components/adminHeader';
import FormularioProduto from '@/components/admin/FormularioProduto';
import Movimento from '@/components/admin/Movimento';
import { Alert, Card, Container, PageHeader } from '@/components/ui';
import { paginaDeAdmin } from '@/lib/autorizacao';
import connectDB from '@/lib/db';
import { movimentosDe } from '@/lib/gestao';
import { Product } from '@/lib/models';
import { categoriasParaFormulario } from '../dados';

export const metadata = { title: 'Produto · Painel' };

const MOTIVO: Record<string, string> = {
  'venda-loja': 'vendido na loja',
  entrada: 'entrada',
  acerto: 'acerto',
  quebra: 'partiu ou perdeu-se',
  'reserva-online': 'reservado online',
  'reserva-libertada': 'reserva libertada',
};

const DATA = new Intl.DateTimeFormat('pt-PT', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'Europe/Lisbon',
});

async function ler(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) return 'nao-existe' as const;
  try {
    await connectDB();
    const [produto, categorias, movimentos] = await Promise.all([
      Product.findById(id).lean(),
      categoriasParaFormulario(),
      movimentosDe(id, 50),
    ]);
    if (!produto) return 'nao-existe' as const;
    return { produto, categorias, movimentos: movimentos ?? [] };
  } catch (erro) {
    console.error('Painel: produto indisponível:', erro);
    return null;
  }
}

export default async function EditarProdutoPage({ params }: { params: Promise<{ id: string }> }) {
  await paginaDeAdmin();
  const { id } = await params;
  const dados = await ler(id);
  if (dados === 'nao-existe') notFound();

  return (
    <>
      <AdminHeader />
      <main id="conteudo" className="py-10">
        <Container className="max-w-3xl">
          {dados === null || dados.categorias === null ? (
            <>
              <PageHeader title="Produto" align="left" />
              <Alert tone="erro" className="mt-8">
                Não foi possível ler a base de dados.
              </Alert>
            </>
          ) : (
            <>
              <PageHeader title={dados.produto.name} align="left" />

              <section aria-labelledby="stock" className="mt-8">
                <h2 id="stock" className="mb-4 font-serif text-2xl text-rose-700">
                  Stock
                </h2>
                <ul className="mb-4 space-y-1 text-sm">
                  {dados.produto.variantes.map((v) => (
                    <li key={String(v._id)}>
                      {v.medida ? `Medida ${v.medida}: ` : 'Em stock: '}
                      <strong className="tabular">{v.stock}</strong>
                    </li>
                  ))}
                </ul>
                <Card className="p-5">
                  <Movimento
                    produtoId={id}
                    medidas={dados.produto.variantes.map((v) => ({
                      id: String(v._id),
                      rotulo: v.medida ?? 'Única',
                    }))}
                  />
                </Card>
              </section>

              <section aria-labelledby="dados" className="mt-10">
                <h2 id="dados" className="mb-4 font-serif text-2xl text-rose-700">
                  Dados do produto
                </h2>
                <FormularioProduto
                  categorias={dados.categorias}
                  inicial={{
                    id,
                    name: dados.produto.name,
                    slug: dados.produto.slug,
                    description: dados.produto.description,
                    priceCents: dados.produto.priceCents,
                    weightGrams: dados.produto.weightGrams,
                    categoryId: String(dados.produto.categoryId),
                    images: dados.produto.images,
                    featured: dados.produto.featured,
                    active: dados.produto.active,
                    dimensions: dados.produto.dimensions,
                    variantes: dados.produto.variantes.map((v) => ({
                      _id: String(v._id),
                      medida: v.medida,
                      stock: v.stock,
                    })),
                  }}
                />
              </section>

              <section aria-labelledby="historico" className="mt-10">
                <h2 id="historico" className="mb-4 font-serif text-2xl text-rose-700">
                  Movimentos
                </h2>
                {dados.movimentos.length === 0 ? (
                  <p className="text-sm text-ink-muted">Ainda não houve movimentos.</p>
                ) : (
                  <table className="w-full text-left text-sm">
                    <caption className="sr-only">Os últimos movimentos de stock deste produto</caption>
                    <thead>
                      <tr className="border-b border-line">
                        <th scope="col" className="py-2 pr-4 font-medium">Quando</th>
                        <th scope="col" className="py-2 pr-4 font-medium">O quê</th>
                        <th scope="col" className="py-2 pr-4 font-medium">Quanto</th>
                        <th scope="col" className="py-2 font-medium">Nota</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dados.movimentos.map((m) => (
                        <tr key={String(m._id)} className="border-b border-line">
                          <td className="tabular py-2 pr-4">{DATA.format(m.em)}</td>
                          <td className="py-2 pr-4">{MOTIVO[m.motivo] ?? m.motivo}</td>
                          <td className="tabular py-2 pr-4">{m.delta > 0 ? `+${m.delta}` : m.delta}</td>
                          <td className="py-2 text-ink-muted">{m.nota}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>
            </>
          )}
        </Container>
      </main>
    </>
  );
}
