import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import Footer from '@/components/footer';
import Header from '@/components/header';
import { estadoParaPessoa } from '@/components/checkout/estado';
import { Alert, Card, Container, LIGACAO_EM_TEXTO, PageHeader } from '@/components/ui';
import { formatarPreco } from '@/lib/dinheiro';
import { lerEncomenda } from '@/lib/encomenda';
import { AtualizarEnquantoEspera, TirarDoCarrinho } from './cliente';

export const metadata: Metadata = {
  title: 'A sua encomenda',
  robots: { index: false },
};

const dataLonga = new Intl.DateTimeFormat('pt-PT', { dateStyle: 'long', timeZone: 'Europe/Lisbon' });

/**
 * A encomenda, para quem a fez (ROADMAP-V2, P1). E para aqui que a Stripe
 * devolve a pessoa depois de pagar, e e a ligacao que vai no email.
 *
 * Sem conta, o que prova que a encomenda e sua e a chave no endereco
 * (`lib/encomenda.ts`). Sem ela, ou com outra, 404 — igual a uma encomenda
 * que nao existe. O estado le-se da base de dados a cada pedido, e nunca do
 * endereco: `?estado=pago` escrevia-o qualquer um.
 */
export default async function Pagina({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const [{ id }, { chave }] = await Promise.all([params, searchParams]);
  if (typeof chave !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(chave)) notFound();

  const e = await lerEncomenda(id, chave);
  if (!e) notFound();

  const estado = estadoParaPessoa(e);
  const pagas = e.paymentStatus === 'PAID' && e.status !== 'CANCELLED';

  return (
    <>
      <Header />
      <main id="conteudo" className="min-h-screen bg-surface py-8 md:py-12">
        <Container className="max-w-3xl">
          <PageHeader
            title={`Encomenda ${e.numero}`}
            lead={`Feita em ${dataLonga.format(new Date(e.criadaEm))}.`}
            align="left"
          />

          <Alert tone={estado.tom} className="mt-8">
            <p className="font-medium">{estado.titulo}</p>
            <p className="mt-1">{estado.detalhe}</p>
            <AtualizarEnquantoEspera aEsperar={estado.aEsperar} />
          </Alert>
          <TirarDoCarrinho pagas={pagas} linhas={e.items} />

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <Card className="p-6">
              <h2 className="mb-4 font-serif text-2xl text-rose-700">As peças</h2>
              <ul className="space-y-2 border-b border-line pb-4 text-sm">
                {e.items.map((l) => (
                  <li key={`${l.productId}:${l.varianteId}`} className="flex justify-between gap-4">
                    <span>
                      {l.name}
                      {l.medida && `, medida ${l.medida}`}
                      {l.quantity > 1 && ` × ${l.quantity}`}
                    </span>
                    <span className="tabular whitespace-nowrap">{formatarPreco(l.priceCents * l.quantity)}</span>
                  </li>
                ))}
              </ul>
              <dl className="space-y-2 pt-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink-muted">Peças</dt>
                  <dd className="tabular">{formatarPreco(e.subtotalCents)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-muted">Portes</dt>
                  <dd className="tabular">{formatarPreco(e.shippingCents)}</dd>
                </div>
                <div className="flex items-baseline justify-between border-t border-line pt-3">
                  <dt className="font-semibold text-ink">Total, com IVA</dt>
                  <dd className="tabular text-xl font-semibold text-rose-700">{formatarPreco(e.totalCents)}</dd>
                </div>
              </dl>
            </Card>

            <Card className="p-6">
              <h2 className="mb-4 font-serif text-2xl text-rose-700">A entrega</h2>
              <address className="text-sm not-italic leading-relaxed">
                {e.customerName}
                <br />
                {e.shippingAddress}
                <br />
                {e.shippingPostal} {e.shippingCity}
              </address>
            </Card>
          </div>

          <p className="mt-8 text-sm text-ink-muted">
            Para desistir da compra, ou se uma peça chegar com defeito, veja{' '}
            <Link href="/envios" className={LIGACAO_EM_TEXTO}>
              Envios e devoluções
            </Link>
            . Guarde esta ligação: é por ela que volta a esta página.
          </p>
        </Container>
      </main>
      <Footer />
    </>
  );
}
