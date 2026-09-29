'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logotipo from '@/components/marca';
import { List, ShoppingCart, User, X } from '@phosphor-icons/react';
import { useCart } from '@/contexts/CartContext';

const LIGACOES = [
  { href: '/', label: 'Início' },
  { href: '/sobre-nos', label: 'Sobre Nós' },
  { href: '/catalogo', label: 'Catálogo' },
  { href: '/loja', label: 'Loja' },
];

/** A pagina onde se esta: `/produto/...` conta como loja. */
function atual(caminho: string, href: string): boolean {
  if (href === '/') return caminho === '/';
  if (href === '/loja') return caminho.startsWith('/loja') || caminho.startsWith('/produto');
  return caminho.startsWith(href);
}

/**
 * O cabecalho. Claro, fino e sem faixa escura: numa loja de pecas, o que se
 * ve primeiro tem de ser a peca, nao a moldura. A linha por baixo separa-o
 * do conteudo quando a pagina corre por baixo dele.
 */
export default function Header() {
  const [aberto, setAberto] = useState(false);
  const { itemCount, openCart } = useCart();
  const caminho = usePathname() ?? '/';

  const icone =
    'flex h-11 w-11 items-center justify-center rounded text-ink transition-smooth hover:bg-surface-sunken hover:text-rose-700';

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-surface/95 backdrop-blur supports-[not(backdrop-filter:blur(0))]:bg-surface">
      <div className="container-custom">
        <div className="flex h-16 items-center justify-between gap-6 md:h-[72px]">
          <Link href="/" className="flex items-center text-[20px] text-rose-700 sm:text-[24px] md:text-[28px]">
            <Logotipo lettering="tinta" />
          </Link>

          <nav aria-label="Principal" className="hidden items-center gap-1 md:flex">
            {LIGACOES.map((l) => {
              const aqui = atual(caminho, l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={aqui ? 'page' : undefined}
                  className={
                    'relative rounded px-4 py-2 text-[15px] font-medium transition-smooth hover:text-rose-700 ' +
                    // A pagina atual diz-se com um traco, e nao so com a cor.
                    (aqui
                      ? 'text-rose-700 after:absolute after:inset-x-4 after:-bottom-px after:h-px after:bg-rose-700'
                      : 'text-ink')
                  }
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1">
            <Link href="/area-pessoal" className={icone} aria-label="Área Pessoal">
              <User className="h-6 w-6" />
            </Link>

            <Link
              href="/carrinho"
              onClick={(e) => {
                // Continua a ser uma ligacao: sem JS, com o botao do meio ou
                // com Ctrl/Cmd abre a pagina do carrinho como sempre abriu.
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                e.preventDefault();
                openCart();
              }}
              className={`relative ${icone}`}
              aria-label="Carrinho de Compras"
            >
              <ShoppingCart className="h-6 w-6" />
              {itemCount > 0 && (
                <span className="tabular absolute right-0.5 top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-700 px-1 text-xs font-semibold text-surface">
                  {itemCount}
                </span>
              )}
            </Link>

            <button className={`${icone} md:hidden`} onClick={() => setAberto(!aberto)} aria-label="Menu" aria-expanded={aberto}>
              {aberto ? <X className="h-7 w-7" /> : <List className="h-7 w-7" />}
            </button>
          </div>
        </div>

        {aberto && (
          <nav aria-label="Principal, no telemóvel" className="fade-in border-t border-line py-3 md:hidden">
            <ul>
              {LIGACOES.map((l) => {
                const aqui = atual(caminho, l.href);
                return (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      aria-current={aqui ? 'page' : undefined}
                      className={`flex items-center justify-between py-3 font-serif text-2xl transition-smooth hover:text-rose-700 ${
                        aqui ? 'text-rose-700' : 'text-ink'
                      }`}
                      onClick={() => setAberto(false)}
                    >
                      {l.label}
                      {aqui && (
                        <span aria-hidden className="font-sans text-sm text-ink-muted">
                          aqui
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
}
