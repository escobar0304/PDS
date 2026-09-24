import Link from 'next/link';
import AdminHeader from '@/components/adminHeader';
import { Alert, Card, Container, PageHeader } from '@/components/ui';
import { paginaDeAdmin } from '@/lib/autorizacao';
import { stockTotal } from '@/lib/catalogo';
import { listarProdutos } from '@/lib/gestao';

export const metadata = { title: 'Painel' };

async function resumo() {
  try {
    const produtos = await listarProdutos();
    const ativos = produtos.filter((p) => p.active);
    return {
      ativos: ativos.length,
      esgotados: ativos.filter((p) => stockTotal(p.variantes) === 0).length,
      reservados: produtos.reduce(
        (s, p) => s + p.variantes.reduce((t, v) => t + v.reservadoOnline, 0),
        0
      ),
    };
  } catch (erro) {
    console.error('Painel: resumo indisponível:', erro);
    return null;
  }
}

export default async function AdminPage() {
  await paginaDeAdmin();
  const r = await resumo();

  return (
    <>
      <AdminHeader />
      <main id="conteudo" className="py-10">
        <Container>
          <PageHeader title="Painel" lead="Produtos, medidas, stock e categorias." align="left" />

          {r ? (
            <dl className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                ['Produtos à venda', r.ativos],
                ['Esgotados', r.esgotados],
                ['Unidades reservadas online, por pagar', r.reservados],
              ].map(([rotulo, valor]) => (
                <Card key={rotulo} className="p-5">
                  <dt className="text-sm text-ink-muted">{rotulo}</dt>
                  <dd className="tabular mt-1 text-3xl font-semibold text-ink">{valor}</dd>
                </Card>
              ))}
            </dl>
          ) : (
            <Alert tone="erro" className="mt-8">
              Não foi possível ler a base de dados. O resumo volta quando ela voltar.
            </Alert>
          )}

          <ul className="mt-8 space-y-2">
            <li>
              <Link href="/admin/produtos" className="text-rose-700 underline underline-offset-2">
                Produtos e stock
              </Link>
            </li>
            <li>
              <Link href="/admin/categorias" className="text-rose-700 underline underline-offset-2">
                Categorias
              </Link>
            </li>
          </ul>
        </Container>
      </main>
    </>
  );
}
