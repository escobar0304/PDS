import Link from 'next/link';
import AdminHeader from '@/components/adminHeader';
import { Alert, Card, Container, PageHeader } from '@/components/ui';
import { paginaDeAdmin } from '@/lib/autorizacao';
import { stockTotal } from '@/lib/catalogo';
import { listarProdutos } from '@/lib/gestao';
import { contarEncomendas } from '@/lib/gestao-encomendas';
import { estadoDaLoja } from '@/lib/loja';

export const metadata = { title: 'Painel' };

async function resumo() {
  try {
    const [produtos, encomendas] = await Promise.all([listarProdutos(), contarEncomendas()]);
    const ativos = produtos.filter((p) => p.active);
    return {
      ...encomendas,
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
  const loja = estadoDaLoja();

  return (
    <>
      <AdminHeader />
      <main id="conteudo" className="py-10">
        <Container>
          <PageHeader title="Painel" lead="Encomendas, produtos, medidas, stock e categorias." align="left" />

          {r && (r.porPreparar > 0 || r.aResolver > 0) && (
            <Card className="mt-8 p-5">
              <h2 className="font-medium text-ink">Encomendas à espera</h2>
              <ul className="mt-2 space-y-1 text-sm">
                {r.porPreparar > 0 && (
                  <li>
                    <Link href="/admin/encomendas?filtro=por-preparar" className="text-rose-700 underline underline-offset-2">
                      {r.porPreparar} {r.porPreparar === 1 ? 'paga, por preparar' : 'pagas, por preparar'}
                    </Link>
                  </li>
                )}
                {r.aResolver > 0 && (
                  <li>
                    <Link href="/admin/encomendas?filtro=a-resolver" className="text-danger-700 underline underline-offset-2">
                      {r.aResolver} com dinheiro por resolver
                    </Link>
                  </li>
                )}
              </ul>
            </Card>
          )}

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

          {/*
            A loja abre sozinha quando nao faltar nada (`lib/loja.ts`). Quem
            gere tem de saber o que falta sem ler o codigo.
          */}
          <Card className="mt-8 p-5">
            <h2 className="font-medium text-ink">
              {loja.aberta
                ? loja.ensaio
                  ? 'Loja online aberta em ensaio: portes e prazo inventados, pagamentos de teste'
                  : 'Loja online aberta: aceita encomendas'
                : 'Loja online fechada: não aceita encomendas'}
            </h2>
            {!loja.aberta && (
              <>
                <p className="mt-2 text-sm text-ink-muted">Abre quando deixar de faltar:</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-muted">
                  {loja.faltas.map((f) => (
                    <li key={f.campo}>
                      <span className="font-medium text-ink">{f.campo}</span> — {f.porque}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Card>

          <ul className="mt-8 space-y-2">
            <li>
              <Link href="/admin/encomendas" className="text-rose-700 underline underline-offset-2">
                Encomendas
              </Link>
            </li>
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
