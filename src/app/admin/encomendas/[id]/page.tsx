import { notFound } from 'next/navigation';
import AdminHeader from '@/components/adminHeader';
import AcoesEncomenda from '@/components/admin/AcoesEncomenda';
import { Alert, Card, Container, PageHeader } from '@/components/ui';
import { paginaDeAdmin } from '@/lib/autorizacao';
import { formatarPreco } from '@/lib/dinheiro';
import { encomendaDoPainel } from '@/lib/gestao-encomendas';
import { NOMES_DOS_ESTADOS } from '@/lib/transicoes';

export const metadata = { title: 'Encomenda · Painel' };

const DATA = new Intl.DateTimeFormat('pt-PT', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Lisbon' });

const PAGAMENTO: Record<string, string> = {
  PENDING: 'por pagar',
  PAID: 'paga',
  FAILED: 'falhou',
  REFUNDED: 'reembolsada',
};

async function ler(id: string) {
  try {
    return (await encomendaDoPainel(id)) ?? ('nao-existe' as const);
  } catch (erro) {
    console.error('Painel: encomenda indisponível:', erro);
    return null;
  }
}

export default async function AdminEncomendaPage({ params }: { params: Promise<{ id: string }> }) {
  await paginaDeAdmin();
  const e = await ler((await params).id);
  if (e === 'nao-existe') notFound();

  if (e === null) {
    return (
      <>
        <AdminHeader />
        <main id="conteudo" className="py-10">
          <Container>
            <PageHeader title="Encomenda" align="left" />
            <Alert tone="erro" className="mt-8">
              Não foi possível ler a base de dados.
            </Alert>
          </Container>
        </main>
      </>
    );
  }

  const avisoPorEnviar =
    (e.status === 'SHIPPED' && !e.avisoExpedicaoEm) || (e.paymentStatus === 'REFUNDED' && !e.avisoReembolsoEm);

  return (
    <>
      <AdminHeader />
      <main id="conteudo" className="py-10">
        <Container className="max-w-4xl">
          <PageHeader
            title={`Encomenda ${e.numero}`}
            lead={`${NOMES_DOS_ESTADOS[e.status]} · pagamento ${PAGAMENTO[e.paymentStatus]} · feita em ${DATA.format(e.createdAt)}`}
            align="left"
          />

          {e.pagoDepoisDeCancelada && e.paymentStatus === 'PAID' && (
            <Alert tone="erro" className="mt-6">
              O pagamento chegou depois de a reserva expirar: a encomenda já estava cancelada e as peças
              voltaram ao stock. Se ainda as tem, fale com quem comprou; se não, reembolse.
            </Alert>
          )}
          {e.pagamentoDivergente && (
            <Alert tone="erro" className="mt-6">
              A Stripe cobrou um valor diferente do total da encomenda. Não avançou: veja o pagamento{' '}
              {e.pagamentoId} no painel da Stripe.
            </Alert>
          )}

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <Card className="p-6">
              <h2 className="mb-4 font-serif text-xl text-rose-700">O que fazer</h2>
              <AcoesEncomenda
                e={{
                  id: String(e._id),
                  status: e.status,
                  paymentStatus: e.paymentStatus,
                  totalTexto: formatarPreco(e.totalCents),
                  avisoPorEnviar,
                }}
              />
              {e.status !== 'PROCESSING' && e.status !== 'SHIPPED' && !avisoPorEnviar && !(e.paymentStatus === 'PAID' && e.status === 'CANCELLED') && (
                <p className="text-sm text-ink-muted">Nada por fazer nesta encomenda.</p>
              )}
            </Card>

            <Card className="p-6">
              <h2 className="mb-4 font-serif text-xl text-rose-700">Para quem</h2>
              <address className="text-sm not-italic leading-relaxed">
                {e.customerName}
                <br />
                {e.shippingAddress}
                <br />
                {e.shippingPostal} {e.shippingCity}
                <br />
                <a href={`mailto:${e.customerEmail}`} className="text-rose-700 underline underline-offset-2">
                  {e.customerEmail}
                </a>
                <br />
                <a href={`tel:${e.customerPhone}`} className="text-rose-700 underline underline-offset-2">
                  {e.customerPhone}
                </a>
              </address>
              {e.seguimento && <p className="mt-4 text-sm">Seguimento dos CTT: {e.seguimento}</p>}
            </Card>
          </div>

          <Card className="mt-6 p-6">
            <h2 className="mb-4 font-serif text-xl text-rose-700">As peças</h2>
            <ul className="space-y-2 border-b border-line pb-4 text-sm">
              {e.items.map((l) => (
                <li key={`${l.productId}:${l.varianteId}`} className="flex justify-between gap-4">
                  <span>
                    {l.name}
                    {l.medida && `, medida ${l.medida}`} × {l.quantity}
                  </span>
                  <span className="tabular">{formatarPreco(l.priceCents * l.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="space-y-1 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-muted">Portes</dt>
                <dd className="tabular">{formatarPreco(e.shippingCents)}</dd>
              </div>
              <div className="flex justify-between font-semibold">
                <dt>Total</dt>
                <dd className="tabular">{formatarPreco(e.totalCents)}</dd>
              </div>
            </dl>
          </Card>

          <Card className="mt-6 overflow-x-auto p-6">
            <table className="w-full text-left text-sm">
              <caption className="mb-3 text-left font-serif text-xl text-rose-700">Histórico</caption>
              <thead>
                <tr className="border-b border-line text-ink-muted">
                  <th scope="col" className="py-2 pr-4 font-medium">Quando</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Passou a</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Quem</th>
                  <th scope="col" className="py-2 font-medium">Nota</th>
                </tr>
              </thead>
              <tbody>
                {e.historico.map((h, i) => (
                  <tr key={i} className="border-b border-line last:border-0">
                    <td className="py-2 pr-4 tabular">{DATA.format(h.em)}</td>
                    <td className="py-2 pr-4">{NOMES_DOS_ESTADOS[h.para]}</td>
                    <td className="py-2 pr-4">{h.por.startsWith('admin:') ? 'painel' : h.por}</td>
                    <td className="py-2">{h.nota}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </Container>
      </main>
    </>
  );
}
