'use client';

/**
 * Ultima rede: erros no proprio `layout` raiz.
 *
 * O `error.tsx` normal vive dentro do layout, por isso nao apanha um erro que
 * aconteca a construir o proprio layout. Quando isso acontece sem este
 * ficheiro, o Next mostra a sua pagina branca de omissao — sem marca, em
 * ingles, e sem forma de voltar.
 *
 * Tem de trazer <html> e <body> porque substitui o layout inteiro, e por isso
 * nao ha Tailwind garantido nem tipos de letra carregados: os estilos vao em
 * linha e as cores sao as da paleta escritas a mao. Uma pagina de erro que
 * depende do que rebentou nao e uma pagina de erro.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-PT">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fbfaf4',
          color: '#24191c',
          fontFamily: 'Georgia, "Times New Roman", serif',
          padding: '1.5rem',
        }}
      >
        <main style={{ maxWidth: '32rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.75rem', color: '#853243', margin: '0 0 1rem' }}>
            Algo correu mal
          </h1>
          <p style={{ color: '#705c61', lineHeight: 1.6, margin: '0 0 1.75rem' }}>
            Aconteceu um erro que não conseguimos tratar. Tente outra vez; se
            continuar, o problema é nosso e já estamos a par.
          </p>

          <button
            type="button"
            onClick={reset}
            style={{
              padding: '0.875rem 1.75rem',
              border: '1px solid #853243',
              borderRadius: 4,
              background: '#853243',
              color: '#fbfaf4',
              fontSize: '1rem',
              cursor: 'pointer',
            }}
          >
            Tentar outra vez
          </button>

          {/*
            O `digest` identifica o erro nos registos do servidor sem expor a
            mensagem, que pode conter caminhos ou dados. E o que permite a
            quem ligar a dizer "aparece-me este codigo" ser ajudado.
          */}
          {error.digest && (
            <p style={{ marginTop: '2rem', fontSize: '0.75rem', color: '#705c61' }}>
              Código do erro: <code>{error.digest}</code>
            </p>
          )}
        </main>
      </body>
    </html>
  );
}
