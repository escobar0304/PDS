import Link from 'next/link';
import AdminHeader from '@/components/adminHeader';
import VendaNaLoja from '@/components/admin/VendaNaLoja';
import { Alert, Badge, Card, Container, PageHeader, botaoClasses } from '@/components/ui';
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
            // Cartoes e nao tabela: numa tabela, o "vendido na loja" ficava na
            // ultima coluna e, no telemovel, fora do ecra — e e no telemovel,
            // ao balcao, que ele mais se usa.
            <ul className="mt-8 space-y-4">
              {produtos.map((p) => (
                <li key={String(p._id)}>
                  <Card className="p-5">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <h2 className="font-medium">
                        <Link
                          href={`/admin/produtos/${p._id}`}
                          className="text-rose-700 underline underline-offset-2"
                        >
                          {p.name}
                        </Link>
                        {!p.active && (
                          <Badge tone="neutro" className="ml-2">
                            desativado
                          </Badge>
                        )}
                      </h2>
                      <span className="tabular text-ink">{formatarPreco(p.priceCents)}</span>
                    </div>
                    <ul className="mt-3 divide-y divide-line border-t border-line">
                      {p.variantes.map((v) => (
                        <li
                          key={String(v._id)}
                          className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-3 text-sm"
                        >
                          <span className="min-w-[5rem] font-medium">{v.medida ?? 'Única'}</span>
                          <span className="tabular">Em stock: {v.stock}</span>
                          <span className="tabular">
                            Reservado online:{' '}
                            {v.reservadoOnline > 0 ? (
                              <strong className="text-danger-700">{v.reservadoOnline}</strong>
                            ) : (
                              0
                            )}
                          </span>
                          <VendaNaLoja
                            produtoId={String(p._id)}
                            varianteId={String(v._id)}
                            rotulo={v.medida ? `${p.name}, medida ${v.medida}` : p.name}
                            disponivel={v.stock > 0}
                          />
                        </li>
                      ))}
                    </ul>
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
