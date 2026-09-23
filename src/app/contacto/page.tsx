import type { Metadata } from 'next';
import { Clock, Envelope, MapPin, Phone } from '@phosphor-icons/react/dist/ssr';
import Header from '@/components/header';
import Footer from '@/components/footer';
import ContactForm from '@/components/contactForm';
import { Alert, Card, Container, PageHeader } from '@/components/ui';
import { camposEmFalta, EMPRESA, moradaFormatada } from '@/lib/empresa';
import { LIVRO_RECLAMACOES } from '@/lib/paginas';

export const metadata: Metadata = {
  title: 'Contactos',
  description: 'Como falar connosco, e quem somos para efeitos legais.',
};

/**
 * Pagina de contactos.
 *
 * Faz duas coisas ao mesmo tempo, e a segunda e a que obriga a existir: o
 * art. 10 do DL 7/2004 exige que a identificacao do prestador esteja
 * acessivel de forma permanente e direta. Uma pagina de contactos e onde
 * quem procura vai procurar.
 *
 * Os dados saem todos de `src/lib/empresa.ts`. O que ainda nao existe
 * aparece como em falta, nunca inventado — o rodape chegou a producao com
 * `+351 xxx xxx xxx` porque ninguem tinha onde dizer que faltava.
 */

function Contacto({
  Icone,
  rotulo,
  valor,
  href,
}: {
  Icone: typeof MapPin;
  rotulo: string;
  valor: string | null;
  href?: string | null;
}) {
  return (
    <div className="flex gap-3">
      <Icone className="mt-0.5 h-5 w-5 shrink-0 text-rose-700" aria-hidden />
      <div>
        <p className="font-medium text-ink">{rotulo}</p>
        {valor ? (
          href ? (
            <a
              href={href}
              className="inline-block py-1 text-sm text-ink-muted transition-smooth hover:text-rose-700"
            >
              {valor}
            </a>
          ) : (
            <p className="text-sm text-ink-muted">{valor}</p>
          )
        ) : (
          <p className="text-sm text-danger-700">por preencher</p>
        )}
      </div>
    </div>
  );
}

export default function ContactoPage() {
  const faltam = camposEmFalta();

  return (
    <>
      <Header />

      <main id="conteudo" className="min-h-screen bg-surface py-12">
        <Container>
          <div className="mx-auto max-w-5xl">
            <PageHeader
              title="Contactos"
              lead="Escreva-nos e respondemos assim que possível."
              align="left"
            />

            <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_20rem] lg:gap-16">
              <div>
                <h2 className="mb-5 font-serif text-2xl text-rose-700">Enviar mensagem</h2>
                <ContactForm />
              </div>

              <aside className="space-y-8">
                <Card className="space-y-5 p-6">
                  <h2 className="font-serif text-xl text-rose-700">Onde nos encontra</h2>

                  <Contacto
                    Icone={Envelope}
                    rotulo="Email"
                    valor={EMPRESA.email}
                    href={EMPRESA.email ? `mailto:${EMPRESA.email}` : null}
                  />
                  <Contacto
                    Icone={Phone}
                    rotulo="Telefone"
                    valor={EMPRESA.telefone}
                    href={EMPRESA.telefone ? `tel:${EMPRESA.telefone.replace(/\s/g, '')}` : null}
                  />
                  <Contacto Icone={MapPin} rotulo="Morada" valor={moradaFormatada()} />
                  {EMPRESA.horario && (
                    <Contacto Icone={Clock} rotulo="Horário" valor={EMPRESA.horario} />
                  )}
                </Card>

                {/*
                  Identificacao do prestador: art. 10 do DL 7/2004. Tem de
                  estar acessivel de forma permanente e direta. Nao e
                  sociedade, por isso nao ha conservatoria, matricula nem
                  capital social a indicar.
                */}
                <Card className="space-y-2 p-6 text-sm">
                  <h2 className="mb-3 font-serif text-xl text-rose-700">
                    Identificação
                  </h2>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-ink-muted">Denominação</dt>
                      <dd className={EMPRESA.denominacao ? 'text-ink' : 'text-danger-700'}>
                        {EMPRESA.denominacao ?? 'por preencher'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-ink-muted">NIF</dt>
                      <dd className={EMPRESA.nif ? 'tabular text-ink' : 'text-danger-700'}>
                        {EMPRESA.nif ?? 'por preencher'}
                      </dd>
                    </div>
                  </dl>
                </Card>

                {/*
                  Lei 144/2015, art. 18: a entidade competente, com nome e
                  sitio. "Competente" e nao "aderente" — a obrigacao existe
                  com ou sem adesao, e dizer que aderimos seria inventar.
                */}
                {EMPRESA.entidadeRal && (
                  <section id="litigios">
                  <Card className="p-6 text-sm">
                    <h2 className="mb-3 font-serif text-xl text-rose-700">
                      Resolução de litígios
                    </h2>
                    <p className="mb-3 text-ink">
                      Em caso de litígio de consumo, pode recorrer à entidade de
                      resolução alternativa de litígios competente:{' '}
                      <a
                        href={EMPRESA.entidadeRal.sitio}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-rose-700 underline decoration-rose-700/40 underline-offset-2 transition-smooth hover:decoration-rose-700"
                      >
                        {EMPRESA.entidadeRal.nome}
                      </a>
                      .
                    </p>
                    <p className="text-ink-muted">
                      Nos litígios até 5000 €, se escolher a arbitragem, ela é
                      obrigatória para nós (Lei 63/2019). Pode também apresentar
                      reclamação no{' '}
                      <a
                        href={LIVRO_RECLAMACOES.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-rose-700 underline decoration-rose-700/40 underline-offset-2 transition-smooth hover:decoration-rose-700"
                      >
                        Livro de Reclamações Eletrónico
                      </a>
                      .
                    </p>
                  </Card>
                  </section>
                )}

                {faltam.length > 0 && (
                  <Alert tone="erro">
                    Os dados de identificação ainda não estão completos. Enquanto
                    faltarem, o sítio está bloqueado aos motores de busca e não deve
                    ser divulgado.
                  </Alert>
                )}
              </aside>
            </div>
          </div>
        </Container>
      </main>

      <Footer />
    </>
  );
}
