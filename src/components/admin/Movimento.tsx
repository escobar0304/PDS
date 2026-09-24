'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Alert, Button, Input, Select } from '@/components/ui';
import { pedir } from './pedir';

const MOTIVOS = [
  { valor: 'entrada', rotulo: 'Entrada (chegou mercadoria)', sinal: 1 },
  { valor: 'venda-loja', rotulo: 'Vendido na loja', sinal: -1 },
  { valor: 'quebra', rotulo: 'Partiu ou perdeu-se', sinal: -1 },
  { valor: 'acerto', rotulo: 'Acerto (a contagem não bate certo)', sinal: 0 },
] as const;

/**
 * Um movimento de stock: quanto, e porque. Nunca "o stock passa a ser" —
 * ver `lib/stock.ts`. No acerto escreve-se o sinal (-2, +1); nos outros o
 * motivo ja o diz.
 */
export default function Movimento({
  produtoId,
  medidas,
}: {
  produtoId: string;
  medidas: { id: string; rotulo: string }[];
}) {
  const router = useRouter();
  const [varianteId, setVarianteId] = useState(medidas[0]?.id ?? '');
  const [motivo, setMotivo] = useState<(typeof MOTIVOS)[number]['valor']>('entrada');
  const [quantidade, setQuantidade] = useState('1');
  const [nota, setNota] = useState('');
  const [erro, setErro] = useState('');
  const [estado, setEstado] = useState('');
  const [ocupado, setOcupado] = useState(false);

  const escolhido = MOTIVOS.find((m) => m.valor === motivo)!;

  const registar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setEstado('');
    const n = Number.parseInt(quantidade, 10);
    if (!Number.isInteger(n) || n === 0 || String(n) !== quantidade.trim().replace(/^\+/, '')) {
      setErro(escolhido.sinal === 0 ? 'Escreva quanto, com o sinal: -2 ou 3.' : 'Escreva quantas unidades.');
      return;
    }
    const delta = escolhido.sinal === 0 ? n : escolhido.sinal * Math.abs(n);

    setOcupado(true);
    const r = await pedir(`/api/admin/produtos/${produtoId}/stock`, 'POST', {
      varianteId,
      delta,
      motivo,
      ...(nota.trim() ? { nota: nota.trim() } : {}),
    });
    setOcupado(false);

    if (!r.ok) {
      setErro(r.erro);
      return;
    }
    setEstado(`Registado. Fica com ${r.dados.stock} em stock.`);
    setQuantidade('1');
    setNota('');
    router.refresh();
  };

  return (
    <form onSubmit={registar} noValidate className="space-y-4">
      {erro && <Alert tone="erro">{erro}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2">
        {medidas.length > 1 && (
          <Select label="Medida" value={varianteId} onChange={(e) => setVarianteId(e.target.value)}>
            {medidas.map((m) => (
              <option key={m.id} value={m.id}>
                {m.rotulo}
              </option>
            ))}
          </Select>
        )}
        <Select
          label="O que aconteceu"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value as typeof motivo)}
        >
          {MOTIVOS.map((m) => (
            <option key={m.valor} value={m.valor}>
              {m.rotulo}
            </option>
          ))}
        </Select>
        <Input
          label={escolhido.sinal === 0 ? 'Quanto, com o sinal' : 'Quantas unidades'}
          inputMode="numeric"
          value={quantidade}
          onChange={(e) => setQuantidade(e.target.value)}
        />
        <Input label="Nota (opcional)" value={nota} onChange={(e) => setNota(e.target.value)} />
      </div>
      <div className="flex items-center gap-4">
        <Button type="submit" variant="secondary" loading={ocupado}>
          Registar movimento
        </Button>
        <p role="status" className="text-sm text-sage-600">
          {estado}
        </p>
      </div>
    </form>
  );
}
