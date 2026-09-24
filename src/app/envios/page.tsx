import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { Alert, Container, PageHeader } from '@/components/ui';
import { CONDICOES, PRAZOS_LEGAIS, condicoesEmFalta } from '@/lib/condicoes';
import { formatarPreco } from '@/lib/dinheiro';
import { EMPRESA, moradaFormatada } from '@/lib/empresa';
import { formatarPeso } from '@/lib/portes';
import { LIVRO_RECLAMACOES } from '@/lib/paginas';

export const metadata: Metadata = {
  title: 'Envios e devoluções',
  alternates: { canonical: '/envios' },
  description:
    'Para onde enviamos, quando sai a encomenda, quanto custa, e como desistir de uma compra nos 14 dias seguintes.',
};

/**
 * Envios e devolucoes.
 *
 * Tudo o que aqui se afirma vem de `src/lib/condicoes.ts`, decidido pelo
 * negocio. O que ficou por decidir aparece "por preencher" e segura a
 * indexacao — a lei pede prazo e custos de envio antes da compra (DL 24/2014,
 * art. 4.º), e uma pagina de envios sem eles nao e uma pagina de envios.
 *
 * O resto e da lei e nao precisava de decisao: os 14 dias, o reembolso, a
 * garantia de tres anos. **Nao sou jurista**: o texto tem de ser validado por
 * quem o seja antes de publicar.
 */

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

export default function EnviosPage() {
  const faltam = condicoesEmFalta();
  const { livreResolucaoDias, reembolsoDias, garantiaAnos } = PRAZOS_LEGAIS;

  return (
    <>
      <Header />

      <main id="conteudo" className="min-h-screen bg-surface py-12">
        <Container>
          <div className="mx-auto max-w-3xl">
            <PageHeader
              title="Envios e devoluções"
              lead="Para onde enviamos, quando sai, quanto custa, e como desistir de uma compra."
              align="left"
            />

            <div className="mt-10 space-y-10 text-ink">
              {!CONDICOES.encomendasOnline && (
                <Alert tone="info">
                  A loja online ainda não aceita encomendas. Estas são as condições que se
                  aplicam às encomendas feitas no sítio.
                </Alert>
              )}

              {faltam.length > 0 && (
                <Alert tone="erro">
                  Ainda faltam condições que a lei pede antes de uma compra. Enquanto
                  faltarem, o sítio está bloqueado aos motores de busca.
                </Alert>
              )}

              <Seccao titulo="Para onde enviamos">
                <p>
                  Enviamos para {CONDICOES.zonaEnvio}, pelos {CONDICOES.transportadora}.
                </p>
              </Seccao>

              <Seccao titulo="Quando sai a encomenda">
                {CONDICOES.expedicaoNoProprioDia && (
                  <p>
                    As encomendas feitas num dia útil, dentro do horário de expediente,
                    seguem pelos {CONDICOES.transportadora} no próprio dia.
                  </p>
                )}
                <p>
                  Hora-limite para sair no mesmo dia:{' '}
                  {CONDICOES.horaLimiteExpedicao ?? <Falta />}.
                </p>
                <p>Prazo de entrega: {CONDICOES.prazoEntrega ?? <Falta />}.</p>
              </Seccao>

              <Seccao titulo="Quanto custa">
                {CONDICOES.portesPorPeso && (
                  <p>
                    Os portes dependem do peso da encomenda, e são sempre indicados antes
                    de concluir a compra.
                  </p>
                )}
                {CONDICOES.tabelaPortes ? (
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-line">
                        <th scope="col" className="py-2 font-medium">
                          Peso até
                        </th>
                        <th scope="col" className="py-2 font-medium">
                          Portes
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {CONDICOES.tabelaPortes.map((e) => (
                        <tr key={e.ateGramas} className="border-b border-line">
                          <td className="py-2 tabular">{formatarPeso(e.ateGramas)}</td>
                          <td className="py-2 tabular">{formatarPreco(e.precoCents)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>
                    Tabela por escalões de peso: <Falta />.
                  </p>
                )}
                {CONDICOES.precosComIva && (
                  <p className="text-ink-muted">Os preços dos produtos já incluem o IVA.</p>
                )}
              </Seccao>

              {CONDICOES.lojaFisica && CONDICOES.levantamentoNaLoja === true && (
                <Seccao titulo="Levantar na loja">
                  <p>Pode levantar a encomenda na loja: {moradaFormatada() ?? <Falta />}.</p>
                </Seccao>
              )}

              <Seccao titulo="Desistir de uma compra">
                <p>
                  Tem <strong>{livreResolucaoDias} dias</strong>, a contar do dia em que
                  recebe a encomenda, para desistir da compra, sem ter de dar nenhuma razão.
                  É o direito de livre resolução (Decreto-Lei n.º 24/2014).
                </p>
                <p>
                  Para desistir, basta dizer-nos, por escrito, por qualquer meio — um email
                  para {EMPRESA.email ?? <Falta />} chega. Pode usar o formulário abaixo, mas
                  não é obrigatório.
                </p>
                <p>
                  Depois de nos dizer, tem {livreResolucaoDias} dias para nos devolver as
                  peças.{' '}
                  {CONDICOES.devolucaoPagaPeloCliente && (
                    <strong>Os portes da devolução ficam a seu cargo.</strong>
                  )}
                </p>
                <p>
                  Devolvemos tudo o que pagou, incluindo os portes de envio da opção mais
                  barata, até {reembolsoDias} dias depois de sabermos que desistiu. Podemos
                  esperar até recebermos as peças, ou até nos mostrar que as enviou.
                </p>
                <p className="text-ink-muted">
                  Pedimos que as peças voltem como as recebeu. Se tiverem sido usadas para lá
                  do necessário para as ver, a lei permite-nos descontar essa desvalorização.
                </p>
              </Seccao>

              <Seccao titulo="Se uma peça chegar com defeito">
                <p>
                  Todas as peças têm a garantia legal de conformidade de{' '}
                  <strong>{garantiaAnos} anos</strong> (Decreto-Lei n.º 84/2021). Se uma peça
                  não estiver conforme, tem direito a que seja reparada ou substituída, e,
                  se isso não for possível, a uma redução do preço ou ao reembolso.
                </p>
                <p className="text-ink-muted">
                  Cada pedra é diferente de outra na cor, na forma e no brilho. Essa variação
                  é da própria pedra e não é um defeito.
                </p>
              </Seccao>

              <Seccao titulo="Formulário de livre resolução">
                <p className="text-ink-muted">
                  Só precisa de o preencher se quiser. Copie o texto para um email ou para
                  papel.
                </p>
                <div className="rounded-lg border border-line bg-surface-raised p-5 text-sm">
                  <p>
                    Para: {EMPRESA.denominacao ?? <Falta />}, {moradaFormatada() ?? <Falta />},{' '}
                    {EMPRESA.email ?? <Falta />}
                  </p>
                  <p className="mt-3">
                    Pela presente comunico que resolvo o meu contrato de compra e venda do(s)
                    seguinte(s) bem(ns): …
                  </p>
                  <p className="mt-3">Encomendado em … / recebido em …</p>
                  <p className="mt-3">Nome: …</p>
                  <p>Morada: …</p>
                  <p>Assinatura (só se enviar em papel): …</p>
                  <p>Data: …</p>
                </div>
              </Seccao>

              <Seccao titulo="Se não chegarmos a acordo">
                <p>
                  Pode recorrer à entidade de resolução de litígios competente, indicada em{' '}
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
                  . As condições gerais estão nos{' '}
                  <Link href="/termos" className={ligacao}>
                    Termos e Condições
                  </Link>
                  .
                </p>
              </Seccao>
            </div>
          </div>
        </Container>
      </main>

      <Footer />
    </>
  );
}
