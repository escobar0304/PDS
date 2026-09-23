import Link from 'next/link';
import { Compass } from '@phosphor-icons/react/dist/ssr';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { Container } from '@/components/ui';
import { botaoClasses } from '@/components/ui/Button';

export const metadata = { title: 'Página não encontrada' };

/**
 * 404 com o resto do sitio a volta.
 *
 * Sem cabecalho nem rodape — como estava — quem aqui cai fica com dois botoes
 * e mais nada: nem navegacao, nem contactos, nem forma de procurar. Uma pagina
 * de erro e o momento em que a navegacao faz mais falta, nao menos.
 */
export default function NotFound() {
  return (
    <>
      <Header />

      <main id="conteudo" className="min-h-[60vh] bg-surface py-20">
        <Container>
          <div className="mx-auto max-w-lg text-center">
            <Compass className="mx-auto mb-6 h-10 w-10 text-ink-muted" aria-hidden />

            <h1 className="mb-4 font-serif text-3xl text-ink md:text-4xl">
              Não encontrámos esta página
            </h1>
            <p className="mb-8 text-ink-muted">
              A ligação pode estar errada, ou a página pode ter mudado de sítio.
            </p>

            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/loja" className={botaoClasses()}>
                Ver a loja
              </Link>
              <Link href="/" className={botaoClasses({ variant: 'secondary' })}>
                Voltar ao início
              </Link>
            </div>

            <p className="mt-10 text-sm text-ink-muted">
              Se chegou aqui a partir de uma ligação nossa,{' '}
              <Link
                href="/contacto"
                className="text-rose-700 underline decoration-rose-700/40 underline-offset-2 transition-smooth hover:decoration-rose-700"
              >
                diga-nos
              </Link>{' '}
              — é a única maneira de a corrigirmos.
            </p>
          </div>
        </Container>
      </main>

      <Footer />
    </>
  );
}
