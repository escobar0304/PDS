'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Check, Ruler, ShoppingCart } from '@phosphor-icons/react';
import { useCart } from '../contexts/CartContext';
import { SemFotografia } from '@/components/ui';
import { temDeEscolher } from '@/lib/catalogo';
import { formatarPreco } from '@/lib/dinheiro';

export interface ProdutoDoCartao {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  priceCents: number;
  images: string[];
  /** O total das medidas, somado pela API (`paraPublico`). */
  stock: number;
  variantes: { _id: string; medida?: string; stock: number }[];
  featured: boolean;
  weightGrams?: number;
  /** Populada pela API; num pedido sem ela, e so o id. */
  categoryId?: string | { name: string; slug: string };
}

const pesoTexto = (g: number) =>
  g >= 1000 ? `${(g / 1000).toLocaleString('pt-PT', { maximumFractionDigits: 2 })} kg` : `${g} g`;

/**
 * Uma peca, como num gabinete de mineralogia: a fotografia, e por baixo a
 * etiqueta com o que se sabe dela — a familia, o peso, o preco.
 *
 * Nada escrito por cima da fotografia (nem "destaque", nem "esgotado"): a
 * peca ve-se inteira, e o estado diz-se na etiqueta, em texto. Esgotada, a
 * fotografia perde a cor, para se ver de longe.
 */
export default function ProductCard({ product }: { product: ProdutoDoCartao }) {
  const [imageError, setImageError] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const { addItem } = useCart();
  // Um anel escolhe-se pela medida, na pagina dele; uma peca unica
  // adiciona-se daqui.
  const escolher = temDeEscolher(product.variantes);
  const esgotado = product.stock === 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsAdding(true);

    const [unica] = product.variantes;
    addItem(
      {
        _id: product._id,
        varianteId: unica._id,
        name: product.name,
        slug: product.slug,
        priceCents: product.priceCents,
        image: product.images[0] || '',
        stock: unica.stock,
      },
      1
    );

    setTimeout(() => setIsAdding(false), 1000);
  };

  const imagem = !imageError ? product.images?.[0] : undefined;
  const familia = typeof product.categoryId === 'object' ? product.categoryId?.name : undefined;
  const dados = [familia, product.weightGrams ? pesoTexto(product.weightGrams) : undefined].filter(Boolean);

  return (
    <article className="group flex h-full flex-col">
      <Link
        href={`/produto/${product.slug}`}
        className="relative block aspect-4/5 shrink-0 overflow-hidden rounded-lg bg-surface-sunken"
      >
        {imagem ? (
          <Image
            src={imagem}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 80vw"
            className={`object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03] ${
              esgotado ? 'grayscale' : ''
            }`}
            onError={() => setImageError(true)}
          />
        ) : (
          <SemFotografia />
        )}
      </Link>

      <div className="flex flex-1 flex-col border-t border-line pt-4 mt-4">
        {dados.length > 0 && <p className="mb-1 font-mono text-xs text-ink-muted">{dados.join(' · ')}</p>}
        <h3 className="font-serif text-2xl font-semibold leading-tight text-ink">
          <Link
            href={`/produto/${product.slug}`}
            className="transition-smooth hover:text-rose-700 focus-visible:text-rose-700"
          >
            {product.name}
          </Link>
        </h3>

        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <p className="flex flex-col">
            <span className="tabular text-lg font-semibold text-ink">{formatarPreco(product.priceCents)}</span>
            <span className={`text-xs ${esgotado ? 'text-ink-muted' : 'text-danger-700'}`}>
              {esgotado ? 'Esgotado' : product.stock <= 5 ? `Apenas ${product.stock} em stock` : ''}
            </span>
          </p>

          {escolher && !esgotado ? (
            <Link
              href={`/produto/${product.slug}`}
              className="flex h-11 w-11 items-center justify-center rounded border border-rose-700 text-rose-700 transition-smooth hover:bg-rose-700 hover:text-surface"
              aria-label={`Escolher a medida de ${product.name}`}
            >
              <Ruler className="h-5 w-5" aria-hidden />
            </Link>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={esgotado || isAdding}
              className={`flex h-11 w-11 items-center justify-center rounded border transition-smooth ${
                esgotado
                  ? 'cursor-not-allowed border-line text-ink-muted'
                  : isAdding
                    ? 'border-sage-600 bg-sage-600 text-surface'
                    : 'border-rose-700 text-rose-700 hover:bg-rose-700 hover:text-surface'
              }`}
              aria-label="Adicionar ao carrinho"
            >
              {isAdding ? <Check className="h-5 w-5" aria-hidden /> : <ShoppingCart className="h-5 w-5" aria-hidden />}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
