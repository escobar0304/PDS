'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight } from '@phosphor-icons/react';
import ProductCard, { type ProdutoDoCartao } from '@/components/productCard';
import { SkeletonCartao } from '@/components/ui';
import { fetchList } from '@/lib/api';

/**
 * As pecas em destaque, numa gaveta que desliza para o lado. So as que o
 * painel marcou como destaque; sem nenhuma, a seccao nao aparece — uma
 * gaveta vazia na pagina de entrada diz "loja abandonada".
 */
export default function Destaques() {
  const [pecas, setPecas] = useState<ProdutoDoCartao[] | null>(null);

  useEffect(() => {
    let atual = true;
    fetchList<ProdutoDoCartao>('/api/products?sort=featured')
      .then((lista) => atual && setPecas(lista.filter((p) => p.featured).slice(0, 8)))
      .catch(() => atual && setPecas([]));
    return () => {
      atual = false;
    };
  }, []);

  if (pecas !== null && pecas.length === 0) return null;

  return (
    <section aria-labelledby="destaques" className="py-16 md:py-24">
      <div className="container-custom">
        <div className="mb-8 flex flex-wrap items-baseline justify-between gap-4">
          <h2 id="destaques" className="text-4xl text-ink md:text-5xl">
            Em destaque
          </h2>
          <Link
            href="/loja"
            className="inline-flex items-center gap-2 py-2 text-sm font-medium text-rose-700 underline decoration-rose-700/40 underline-offset-4 transition-smooth hover:decoration-rose-700"
          >
            Todas as peças <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
      {/*
        Desliza com o dedo ou com a roda; cada cartao para no sitio. A lista
        continua a ser uma lista, e o teclado percorre-a pelos links.
      */}
      <ul className="container-custom flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 [scrollbar-width:thin]">
        {pecas === null
          ? [1, 2, 3, 4].map((i) => (
              <li key={i} className="w-[78%] shrink-0 snap-start sm:w-[300px]">
                <SkeletonCartao />
              </li>
            ))
          : pecas.map((p) => (
              <li key={p._id} className="w-[78%] shrink-0 snap-start sm:w-[300px]">
                <ProductCard product={p} />
              </li>
            ))}
      </ul>
    </section>
  );
}
