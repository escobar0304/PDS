import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { Alert, Container, PageHeader } from '@/components/ui';
import { AVISO_TRADICAO } from '@/lib/afirmacoes';
import { CONDICOES, PRAZOS_LEGAIS } from '@/lib/condicoes';
import { camposEmFalta, EMPRESA, moradaFormatada } from '@/lib/empresa';
import { LIVRO_RECLAMACOES } from '@/lib/paginas';

export const metadata: Metadata = {
  title: 'Termos e condições',
  alternates: { canonical: '/termos' },
  description:
    'Quem somos, como funcionam os preços, as encomendas e a conta, e o que fazer se não chegarmos a acordo.',
};

/**
 * Termos e condicoes.
 *
 * Estruturado a partir do que o sitio faz e do que o negocio decidiu (ver
 * `src/lib/condicoes.ts`). Nao inventa o que ninguem decidiu: os meios de
 * pagamento nao existem nesta versao e aparecem "por preencher", e o momento
 * em que o contrato fica celebrado nao se escreve ate haver checkout que o
 * defina.
 *
 * **Nao sou jurista.** Tem de ser validado por quem o seja antes de publicar.
 */

/** Data da versao em vigor. Muda sempre que o texto mudar. */
const VERSAO = '23 de setembro de 2026';

const ligacao =
  'text-rose-700 underline decoration-rose-700/40 underline-offset-2 transition-smooth hover:decoration-rose-700';

function Falta() {
  return <span className="text-danger-700">por preencher</span>;
}

function Seccao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 font-serif text-2xl text-rose-700">{titulo}</h2>
      <div className="space-y-3 leading-relaxed">{children}</div>
    </section>
  );
}

export default function TermosPage() {
  const faltamDados = camposEmFalta().length > 0;

  return (
    <>
      <Header />

      <main id="conteudo" className="min-h-screen bg-surface py-12">
        <Container>
          <div className="mx-auto max-w-3xl">
            <PageHeader
              title="Termos e condições"
              lead="As regras de usar este sítio e de comprar nele."
              align="left"
            />

            <div className="mt-10 space-y-10 text-ink">
              {faltamDados && (
                <Alert tone="erro">
                  Faltam os dados de identificação do vendedor. Enquanto faltarem, o sítio
                  está bloqueado aos motores de busca e não deve ser divulgado.
                </Alert>
              )}

              <Seccao titulo="Quem somos">
                <dl className="text-sm">
                  <div className="flex flex-wrap gap-x-2 py-1">
                    <dt className="font-medium">Vendedor:</dt>
                    <dd>{EMPRESA.denominacao ?? <Falta />}</dd>
                  </div>
                  <div className="flex flex-wrap gap-x-2 py-1">
                    <dt className="font-medium">NIF:</dt>
                    <dd>{EMPRESA.nif ?? <Falta />}</dd>
                  </div>
                  <div className="flex flex-wrap gap-x-2 py-1">
                    <dt className="font-medium">Morada:</dt>
                    <dd>{moradaFormatada() ?? <Falta />}</dd>
                  </div>
                </dl>
                {/* Numa frase, e nao sozinha num <dd>: sozinha e um controlo de 17 px
                    de altura, abaixo dos 24 do 2.5.8. */}
                <p className="text-sm">
                  Os contactos estão na{' '}
                  <Link href="/contacto" className={ligacao}>
                    página de contactos
                  </Link>
                  .
                </p>
              </Seccao>

              <Seccao titulo="Preços">
                <p>
                  Os preços estão em euros
                  {CONDICOES.precosComIva && ' e já incluem o IVA à taxa legal em vigor'}. Os
                  portes de envio não estão incluídos: dependem do peso e são indicados
                  antes de concluir a compra. Ver{' '}
                  <Link href="/envios" className={ligacao}>
                    Envios e devoluções
                  </Link>
                  .
                </p>
              </Seccao>

              <Seccao titulo="Encomendas e pagamento">
                {!CONDICOES.encomendasOnline && (
                  <p>A loja online ainda não aceita encomendas.</p>
                )}
                <p>
                  Meios de pagamento:{' '}
                  {CONDICOES.meiosPagamento ? CONDICOES.meiosPagamento.join(', ') : <Falta />}.
                </p>
              </Seccao>

              <Seccao titulo="As peças">
                <p>
                  Cada pedra é diferente de outra na cor, na forma e no brilho, e essa
                  variação é da própria pedra. A descrição de cada peça está na respetiva
                  página.
                </p>
                <p className="text-ink-muted">{AVISO_TRADICAO}</p>
              </Seccao>

              <Seccao titulo="Desistir, devolver, garantia">
                <p>
                  Tem {PRAZOS_LEGAIS.livreResolucaoDias} dias para desistir de uma compra sem
                  dar razão, e todas as peças têm {PRAZOS_LEGAIS.garantiaAnos} anos de
                  garantia legal. Como exercer cada um está em{' '}
                  <Link href="/envios" className={ligacao}>
                    Envios e devoluções
                  </Link>
                  .
                </p>
              </Seccao>

              <Seccao titulo="A sua conta">
                <p>
                  A conta é pessoal, e a palavra-passe é sua: não a partilhe. Pode descarregar
                  os seus dados ou apagar a conta a qualquer momento, na área pessoal. O que
                  fazemos com os dados está na{' '}
                  <Link href="/privacidade" className={ligacao}>
                    Política de privacidade
                  </Link>
                  .
                </p>
              </Seccao>

              <Seccao titulo="Se não chegarmos a acordo">
                <p>
                  Pode recorrer à entidade de resolução alternativa de litígios competente,
                  indicada em{' '}
                  <Link href="/contacto#litigios" className={ligacao}>
                    Contactos
                  </Link>
                  , ou ao{' '}
                  <a
                    href={LIVRO_RECLAMACOES.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={ligacao}
                  >
                    Livro de Reclamações Eletrónico
                  </a>
                  . Estes termos regem-se pela lei portuguesa.
                </p>
              </Seccao>

              <p className="text-sm text-ink-muted">Versão em vigor desde {VERSAO}.</p>
            </div>
          </div>
        </Container>
      </main>

      <Footer />
    </>
  );
}
