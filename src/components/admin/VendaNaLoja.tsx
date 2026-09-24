'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui';
import { pedir } from './pedir';

/**
 * "Vendido na loja": o movimento mais frequente, e o que tem de ser rapido —
 * uma peca vendida ao balcao que continua no sitio e uma peca vendida duas
 * vezes. Um clique, um `-1`, e a lista volta a ler o stock do servidor.
 */
export default function VendaNaLoja({
  produtoId,
  varianteId,
  rotulo,
  disponivel,
}: {
  produtoId: string;
  varianteId: string;
  /** O que o leitor de ecra ouve: "Vendido na loja: Anel, medida 16". */
  rotulo: string;
  disponivel: boolean;
}) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState(false);
  const [estado, setEstado] = useState('');

  const vender = async () => {
    setOcupado(true);
    setEstado('');
    const r = await pedir(`/api/admin/produtos/${produtoId}/stock`, 'POST', {
      varianteId,
      delta: -1,
      motivo: 'venda-loja',
    });
    setOcupado(false);
    setEstado(r.ok ? 'Registado.' : r.erro);
    router.refresh();
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="secondary"
        onClick={vender}
        loading={ocupado}
        disabled={!disponivel}
        aria-label={`Vendido na loja: ${rotulo}`}
      >
        −1 vendido na loja
      </Button>
      <p role="status" className="text-xs text-ink-muted">
        {estado}
      </p>
    </div>
  );
}
