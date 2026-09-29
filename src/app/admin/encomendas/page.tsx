import Link from 'next/link';
import AdminHeader from '@/components/adminHeader';
import { Alert, Badge, Card, Container, PageHeader } from '@/components/ui';
import { paginaDeAdmin } from '@/lib/autorizacao';
import { formatarPreco } from '@/lib/dinheiro';
import { eFiltro, FILTROS, listarEncomendas, type Filtro } from '@/lib/gestao-encomendas';
import { NOMES_DOS_ESTADOS } from '@/lib/transicoes';

export const metadata = { title: 'Encomendas · Painel' };

const DATA = new Intl.DateTimeFormat('pt-PT', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Lisbon' });

async function ler(filtro: Filtro) {
  try {
    return await listarEncomendas(filtro);
  } catch (erro) {
    console.error('Painel: encomendas indisponíveis:', erro);
    return null;
  }
}

export default async function AdminEncomendasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await paginaDeAdmin();
  const { filtro: pedido } = await searchParams;
  const filtro: Filtro = eFiltro(pedido) ? pedido : 'por-preparar';
  const encomendas = await ler(filtro);

  return (
    <>
      <AdminHeader />
      <main id="conteudo" className="py-10">
        <Container>
          <PageHeader
            title="Encomendas"
            lead="As pagas esperam por ser preparadas; as que têm dinheiro por resolver ficam à parte."
            align="left"
          />

          <nav aria-label="Filtrar encomendas" className="mt-6 flex flex-wrap gap-2">
            {(Object.keys(FILTROS) as Filtro[]).map((f) => (
              <Link
                key={f}
                href={`/admin/encomendas?filtro=${f}`}
                aria-current={f === filtro ? 'page' : undefined}
                className={
                  'rounded border px-3 py-1.5 text-sm transition-smooth ' +
                  (f === filtro
                    ? 'border-rose-700 bg-rose-700 text-surface'
                    : 'border-line text-ink hover:border-rose-300')
                }
              >
                {FILTROS[f].rotulo}
              </Link>
            ))}
          </nav>

          {encomendas === null ? (
            <Alert tone="erro" className="mt-8">
              Não foi possível ler a base de dados.
            </Alert>
          ) : encomendas.length === 0 ? (
            <p className="mt-8 text-ink-muted">Nenhuma encomenda aqui.</p>
          ) : (
            <ul className="mt-8 space-y-3">
              {encomendas.map((e) => (
                <li key={String(e._id)}>
                  <Card className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 p-5">
                    <h2 className="font-medium">
                      <Link href={`/admin/encomendas/${e._id}`} className="text-rose-700 underline underline-offset-2">
                        {e.numero}
                      </Link>{' '}
                      <span className="font-normal text-ink-muted">· {e.customerName}</span>
                    </h2>
                    <span className="flex flex-wrap items-center gap-2 text-sm">
                      <Badge tone={e.status === 'PROCESSING' ? 'rose' : e.status === 'CANCELLED' ? 'neutro' : 'sucesso'}>
                        {NOMES_DOS_ESTADOS[e.status]}
                      </Badge>
                      {(e.pagoDepoisDeCancelada || e.pagamentoDivergente) && e.paymentStatus !== 'REFUNDED' && (
                        <Badge tone="perigo">{e.pagamentoDivergente ? 'valor diferente' : 'paga depois de cancelada'}</Badge>
                      )}
                      {e.paymentStatus === 'REFUNDED' && <Badge tone="neutro">reembolsada</Badge>}
                      <span className="tabular">{formatarPreco(e.totalCents)}</span>
                      <span className="text-ink-muted">{DATA.format(e.createdAt)}</span>
                    </span>
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
