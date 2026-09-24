import Link from 'next/link';
import AdminHeader from '@/components/adminHeader';
import VendaNaLoja from '@/components/admin/VendaNaLoja';
import { Alert, Badge, Container, PageHeader, botaoClasses } from '@/components/ui';
import { paginaDeAdmin } from '@/lib/autorizacao';
import { formatarPreco } from '@/lib/dinheiro';
import { listarProdutos } from '@/lib/gestao';

export const metadata = { title: 'Produtos · Painel' };

async function ler() {
  try {
    return await listarProdutos();
  } catch (erro) {
    console.error('Painel: produtos indisponíveis:', erro);
    return null;
  }
}

export default async function AdminProdutosPage() {
  await paginaDeAdmin();
  const produtos = await ler();

  return (
    <>
      <AdminHeader />
      <main id="conteudo" className="py-10">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <PageHeader
              title="Produtos"
              lead="O stock é o da loja: uma venda ao balcão regista-se aqui, no momento."
              align="left"
            />
            <Link href="/admin/produtos/novo" className={botaoClasses()}>
              Novo produto
            </Link>
          </div>

          {produtos === null ? (
            <Alert tone="erro" className="mt-8">
              Não foi possível ler a base de dados.
            </Alert>
          ) : produtos.length === 0 ? (
            <p className="mt-8 text-ink-muted">Ainda não há produtos.</p>
          ) : (
            <div className="mt-8 overflow-x-auto">
              <table className="w-full min-w-[40rem] text-left text-sm">
                <caption className="sr-only">
                  Produtos, com o stock e o reservado online de cada medida
                </caption>
                <thead>
                  <tr className="border-b border-line">
                    <th scope="col" className="py-2 pr-4 font-medium">Produto</th>
                    <th scope="col" className="py-2 pr-4 font-medium">Preço</th>
                    <th scope="col" className="py-2 pr-4 font-medium">Medida</th>
                    <th scope="col" className="py-2 pr-4 font-medium">Stock</th>
                    <th scope="col" className="py-2 pr-4 font-medium">Reservado online</th>
                    <th scope="col" className="py-2 font-medium">
                      <span className="sr-only">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {produtos.map((p) =>
                    p.variantes.map((v, i) => (
                      <tr key={String(v._id)} className="border-b border-line align-middle">
                        {i === 0 && (
                          <>
                            <th scope="row" rowSpan={p.variantes.length} className="py-3 pr-4 font-normal">
                              <Link
                                href={`/admin/produtos/${p._id}`}
                                className="font-medium text-rose-700 underline underline-offset-2"
                              >
                                {p.name}
                              </Link>
                              {!p.active && (
                                <Badge tone="neutro" className="ml-2">
                                  desativado
                                </Badge>
                              )}
                            </th>
                            <td rowSpan={p.variantes.length} className="tabular py-3 pr-4">
                              {formatarPreco(p.priceCents)}
                            </td>
                          </>
                        )}
                        <td className="py-3 pr-4">{v.medida ?? <span className="text-ink-muted">—</span>}</td>
                        <td className="tabular py-3 pr-4">{v.stock}</td>
                        <td className="tabular py-3 pr-4">
                          {v.reservadoOnline > 0 ? (
                            <strong className="text-danger-700">{v.reservadoOnline}</strong>
                          ) : (
                            0
                          )}
                        </td>
                        <td className="py-3">
                          <VendaNaLoja
                            produtoId={String(p._id)}
                            varianteId={String(v._id)}
                            rotulo={v.medida ? `${p.name}, medida ${v.medida}` : p.name}
                            disponivel={v.stock > 0}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Container>
      </main>
    </>
  );
}
