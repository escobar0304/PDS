'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowCounterClockwise, ArrowRight, ChatCircle, SquaresFour, Truck } from '@phosphor-icons/react';
import { Alert, AnuncioEstado, botaoClasses, Button, EmptyState, Skeleton } from '@/components/ui';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { fetchList } from '@/lib/api';
import { INFORMACAO_COMPRA } from '@/lib/afirmacoes';

// Texto em `src/lib/afirmacoes.ts`. Aqui dizia-se "100% autenticos",
// "embalagem sustentavel", "entrega em 2-3 dias uteis" e "limpeza energetica
// antes do envio" — nada disso confirmado pelo negocio.
const CARACTERISTICAS = [
  { Icone: Truck, ...INFORMACAO_COMPRA.envios },
  { Icone: ArrowCounterClockwise, ...INFORMACAO_COMPRA.livreResolucao },
  { Icone: ChatCircle, ...INFORMACAO_COMPRA.duvidas },
];

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  order: number;
}

export default function Catalogo() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let actual = true;
    fetchList<Category>('/api/categories')
      .then((lista) => actual && setCategories(lista))
      .catch((error) => {
        if (!actual) return;
        console.error('Erro ao carregar categorias:', error);
        setErro('Não foi possível carregar as categorias.');
      })
      .finally(() => actual && setLoading(false));
    return () => {
      actual = false;
    };
  }, [tentativa]);

  return (
    <>
      <Header />
      
      <main id="conteudo">
        <section className="container-custom pb-10 pt-10 md:pt-16">
          <h1 className="text-5xl text-ink md:text-7xl">Catálogo</h1>
          <p className="mt-3 max-w-xl text-lg text-ink-muted">
            As famílias de cristais e pedras. Cada família reúne pedras parecidas na composição, mas
            nenhuma peça é igual a outra.
          </p>
          <div className="relative mt-10 aspect-[16/9] overflow-hidden rounded-lg md:aspect-[21/8]">
            <Image
              src="/images/hero-catalogo.png"
              alt="Pedras roladas de ametista sobre um pano de linho"
              fill
              priority
              sizes="(min-width: 1280px) 1216px, 100vw"
              className="object-cover"
            />
          </div>
        </section>

        {/*
          O indice das gavetas: uma familia por linha, o nome grande, e a
          fotografia ao lado quando a categoria a tem. Nada escrito por cima
          da fotografia, onde o contraste dependia de onde calhava a pedra.
        */}
        <section aria-labelledby="familias" className="container-custom pb-20 md:pb-28">
          <h2 id="familias" className="sr-only">
            Famílias
          </h2>

          {!loading && erro && (
            <Alert
              tone="erro"
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setLoading(true);
                    setErro(null);
                    setTentativa((t) => t + 1);
                  }}
                >
                  Tentar novamente
                </Button>
              }
            >
              {erro}
            </Alert>
          )}

          {/*
            Os esqueletos sao `aria-hidden`. Sem isto a pagina nao dizia
            nada a quem nao os ve — nem que estava a carregar, nem que
            tinha acabado.
          */}
          <AnuncioEstado>
            {loading
              ? 'A carregar as categorias'
              : erro
                ? 'Não foi possível carregar as categorias'
                : `${categories.length} categoria${categories.length !== 1 ? 's' : ''}`}
          </AnuncioEstado>

          {loading ? (
            <div className="divide-y divide-line border-y border-line">
              {[1, 2, 3].map((i) => (
                <div key={i} className="py-8">
                  <Skeleton className="h-12 w-2/5" />
                </div>
              ))}
            </div>
          ) : (
            categories.length > 0 && (
              <ul className="divide-y divide-line border-y border-line">
                {categories.map((category) => (
                  <li key={category._id} className="revelar">
                    <Link
                      href={`/loja?categoria=${category.slug}`}
                      className="group grid items-center gap-4 py-8 md:grid-cols-12 md:gap-8"
                    >
                      <h3 className="font-serif text-4xl font-semibold text-ink transition-smooth group-hover:text-rose-700 md:col-span-5 md:text-5xl">
                        {category.name}
                      </h3>
                      <p className="max-w-[50ch] text-ink-muted md:col-span-5">{category.description}</p>
                      <span className="flex items-center gap-2 text-sm font-medium text-rose-700 md:col-span-2 md:justify-end">
                        Ver produtos
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )
          )}

          {!loading && !erro && categories.length === 0 && (
            <EmptyState
              icon={<SquaresFour className="h-10 w-10" />}
              title="Ainda não há categorias"
              description="Estamos a preparar o catálogo. Entretanto pode ver a loja."
              action={
                <Link href="/loja" className={botaoClasses({ variant: 'secondary' })}>
                  Ir à loja
                </Link>
              }
            />
          )}

          {!loading && !erro && categories.length > 0 && (
            <Link href="/loja" className={botaoClasses({ className: 'mt-12' })}>
              Ver todas as peças
            </Link>
          )}
        </section>

        {/* Características */}
        <section className="border-t border-line bg-surface-sunken py-12 md:py-16">
          <div className="container-custom">
            <ul className="grid gap-8 sm:grid-cols-3">
              {CARACTERISTICAS.map(({ Icone, titulo, detalhe }) => (
                <li key={titulo} className="flex gap-3">
                  <Icone className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-700" aria-hidden />
                  <div>
                    <h3 className="mb-1 text-base font-medium text-ink">{titulo}</h3>
                    <p className="text-sm text-ink-muted">{detalhe}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}