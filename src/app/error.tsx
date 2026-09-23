'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { WarningCircle } from '@phosphor-icons/react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { Container } from '@/components/ui';
import { botaoClasses } from '@/components/ui/Button';

/**
 * Erro dentro de uma pagina, com o resto do sitio a volta.
 *
 * Para erros no proprio `layout` raiz — que este nao apanha, porque vive
 * dentro dele — existe o `global-error.tsx`.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <Header />

      <main id="conteudo" className="min-h-[60vh] bg-surface py-20">
        <Container>
          <div className="mx-auto max-w-lg text-center">
            <WarningCircle className="mx-auto mb-6 h-10 w-10 text-danger-700" aria-hidden />

            <h1 className="mb-4 font-serif text-3xl text-ink md:text-4xl">
              Alguma coisa correu mal
            </h1>
            {/* Tratamento por "você", como no resto do sitio. Estava por "tu". */}
            <p className="mb-8 text-ink-muted">
              Não conseguimos carregar esta página. Tente outra vez dentro de
              momentos; se continuar, o problema é nosso.
            </p>

            <div className="flex flex-wrap justify-center gap-3">
              <button type="button" onClick={reset} className={botaoClasses()}>
                Tentar outra vez
              </button>
              <Link href="/" className={botaoClasses({ variant: 'secondary' })}>
                Voltar ao início
              </Link>
            </div>

            {/*
              O `digest` identifica o erro nos registos sem expor a mensagem,
              que pode conter caminhos ou dados.
            */}
            {error.digest && (
              <p className="mt-10 text-xs text-ink-muted">
                Código do erro: <code>{error.digest}</code>
              </p>
            )}
          </div>
        </Container>
      </main>

      <Footer />
    </>
  );
}
