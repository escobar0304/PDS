import type { Metadata } from 'next';
import Link from 'next/link';
import { Question } from '@phosphor-icons/react/dist/ssr';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { Container, EmptyState, PageHeader } from '@/components/ui';
import { botaoClasses } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Perguntas frequentes',
  description: 'Respostas às perguntas que nos fazem mais vezes.',
};

/**
 * Perguntas frequentes.
 *
 * A lista esta vazia de proposito, e fica assim ate haver perguntas reais.
 *
 * Um FAQ inventado e pior do que nenhum: as perguntas que um modelo escreve
 * nao sao as que as pessoas fazem, as respostas comprometem o negocio com
 * prazos e condicoes que ninguem decidiu, e quem o le fica a achar que
 * perguntou e nao obteve resposta. As perguntas verdadeiras aparecem sozinhas
 * — chegam pelo formulario de contacto.
 *
 * Nao e exigido por lei nenhuma, o que e precisamente a razao para nao o
 * apressar.
 */
const PERGUNTAS: { pergunta: string; resposta: string }[] = [];

export default function FaqPage() {
  return (
    <>
      <Header />

      <main id="conteudo" className="min-h-screen bg-surface py-12">
        <Container>
          <div className="mx-auto max-w-3xl">
            <PageHeader
              title="Perguntas frequentes"
              lead="As respostas ao que nos perguntam mais vezes."
              align="left"
            />

            <div className="mt-10">
              {PERGUNTAS.length === 0 ? (
                <EmptyState
                  icon={<Question className="h-10 w-10" />}
                  title="Ainda não temos perguntas para aqui pôr"
                  description="Esta página enche-se com o que nos perguntarem de facto, e não com o que imaginámos que perguntariam. Se tem uma dúvida, faça-a — é assim que a primeira aparece."
                  action={
                    <Link href="/contacto" className={botaoClasses()}>
                      Fazer uma pergunta
                    </Link>
                  }
                />
              ) : (
                <dl className="space-y-8">
                  {PERGUNTAS.map((p) => (
                    <div key={p.pergunta}>
                      <dt className="font-serif text-xl text-ink">{p.pergunta}</dt>
                      <dd className="mt-2 leading-relaxed text-ink-muted">{p.resposta}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </div>
        </Container>
      </main>

      <Footer />
    </>
  );
}
