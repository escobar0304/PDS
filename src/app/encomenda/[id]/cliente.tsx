'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { chaveDe } from '@/lib/cart';

/** De quantos em quantos segundos, e ate quando, se volta a perguntar. */
const INTERVALO_MS = 3000;
const TENTATIVAS = 20;

/**
 * Enquanto o pagamento nao estiver confirmado, volta a pedir a pagina ao
 * servidor. O aviso da Stripe costuma chegar antes da pessoa, mas nem
 * sempre. Um minuto chega; depois disso, diz-se que pode voltar mais tarde.
 */
export function AtualizarEnquantoEspera({ aEsperar }: { aEsperar: boolean }) {
  const router = useRouter();
  const [esgotado, setEsgotado] = useState(false);
  const vezes = useRef(0);

  useEffect(() => {
    if (!aEsperar) return;
    const t = setInterval(() => {
      vezes.current += 1;
      if (vezes.current > TENTATIVAS) {
        clearInterval(t);
        setEsgotado(true);
        return;
      }
      router.refresh();
    }, INTERVALO_MS);
    return () => clearInterval(t);
  }, [aEsperar, router]);

  if (!aEsperar || !esgotado) return null;
  return (
    <p className="mt-2 text-sm">
      Ainda não recebemos a confirmação. Se pagou, não pague outra vez: ela chega, e esta página
      mostra-a quando a abrir de novo, pela ligação que tem.
    </p>
  );
}

/**
 * Paga, as pecas saem do carrinho — so essas, e so as desta encomenda. O que
 * a pessoa tenha acrescentado depois fica.
 */
export function TirarDoCarrinho({
  pagas,
  linhas,
}: {
  pagas: boolean;
  linhas: { productId: string; varianteId: string }[];
}) {
  const { items, pronto, removeItem } = useCart();
  const feito = useRef(false);

  useEffect(() => {
    if (!pagas || !pronto || feito.current) return;
    feito.current = true;
    const compradas = new Set(linhas.map((l) => chaveDe({ _id: l.productId, varianteId: l.varianteId })));
    for (const i of items) if (compradas.has(chaveDe(i))) removeItem(chaveDe(i));
  }, [pagas, pronto, items, linhas, removeItem]);

  return null;
}
