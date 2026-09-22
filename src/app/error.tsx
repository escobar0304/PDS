'use client';

import { useEffect } from 'react';

// Provisorio. Ganha o tratamento visual definitivo na F10 do roteiro.
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
    <main className="container-custom flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <h1 className="mb-4 font-serif text-3xl text-ink md:text-4xl">
        Alguma coisa correu mal
      </h1>
      <p className="mb-8 max-w-md text-ink-muted">
        Não conseguimos carregar esta página. Tenta novamente dentro de momentos.
      </p>
      <button onClick={reset} className="btn-primary">
        Tentar novamente
      </button>
      {error.digest && (
        <p className="mt-8 text-xs text-ink-muted">Referência: {error.digest}</p>
      )}
    </main>
  );
}
