'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Alert, Button, Input } from '@/components/ui';
import { pedir } from './pedir';

export interface EstadoParaAcoes {
  id: string;
  status: string;
  paymentStatus: string;
  totalTexto: string;
  /** Se o email de expedicao ou de reembolso ficou por enviar. */
  avisoPorEnviar: boolean;
}

/**
 * O que se pode fazer a esta encomenda, pelo estado em que esta. O servidor
 * volta a verificar tudo (`lib/gestao-encomendas.ts`): esconder um botao aqui
 * e so para nao o oferecer, nunca o que o impede.
 */
export default function AcoesEncomenda({ e }: { e: EstadoParaAcoes }) {
  const router = useRouter();
  const [seguimento, setSeguimento] = useState('');
  const [erro, setErro] = useState('');
  const [estado, setEstado] = useState('');
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [aConfirmar, setAConfirmar] = useState(false);

  const fazer = async (corpo: Record<string, unknown>) => {
    setErro('');
    setEstado('');
    setOcupado(String(corpo.acao));
    const r = await pedir(`/api/admin/encomendas/${e.id}`, 'PATCH', corpo);
    setOcupado(null);
    setAConfirmar(false);
    if (!r.ok) {
      setErro(r.erro);
      return;
    }
    setEstado(r.dados.avisoFalhou ? 'Feito, mas o email não saiu. Pode enviá-lo outra vez.' : 'Feito.');
    router.refresh();
  };

  const podeReembolsar =
    e.paymentStatus === 'PAID' && (e.status === 'PROCESSING' || e.status === 'CANCELLED');

  return (
    <div className="space-y-5">
      {erro && <Alert tone="erro">{erro}</Alert>}

      {e.status === 'PROCESSING' && (
        <form
          noValidate
          onSubmit={(ev) => {
            ev.preventDefault();
            fazer({ acao: 'expedir', seguimento });
          }}
          className="space-y-3"
        >
          <Input
            label="Número de seguimento dos CTT"
            name="seguimento"
            hint="Como vem na etiqueta, por exemplo RR123456789PT. Vai por email a quem comprou."
            value={seguimento}
            onChange={(ev) => setSeguimento(ev.target.value)}
          />
          <Button type="submit" loading={ocupado === 'expedir'} disabled={!seguimento.trim()}>
            Marcar como enviada
          </Button>
        </form>
      )}

      {e.status === 'SHIPPED' && (
        <Button onClick={() => fazer({ acao: 'concluir' })} loading={ocupado === 'concluir'}>
          Marcar como entregue
        </Button>
      )}

      {e.avisoPorEnviar && (
        <Button variant="secondary" onClick={() => fazer({ acao: 'reenviar-aviso' })} loading={ocupado === 'reenviar-aviso'}>
          Enviar o email outra vez
        </Button>
      )}

      {podeReembolsar && (
        <div className="space-y-2 border-t border-line pt-5">
          <p className="text-sm text-ink-muted">
            {e.status === 'PROCESSING'
              ? 'Cancelar devolve as peças ao stock e o valor pago a quem comprou, pela Stripe.'
              : 'Está cancelada mas paga: devolver o valor a quem comprou, pela Stripe.'}
          </p>
          {/* Dois passos: devolver dinheiro nao se desfaz. */}
          {aConfirmar ? (
            <div className="flex flex-wrap gap-3">
              <Button variant="danger" onClick={() => fazer({ acao: 'reembolsar' })} loading={ocupado === 'reembolsar'}>
                Confirmar: devolver {e.totalTexto}
              </Button>
              <Button variant="ghost" onClick={() => setAConfirmar(false)}>
                Não
              </Button>
            </div>
          ) : (
            <Button variant="secondary" onClick={() => setAConfirmar(true)}>
              {e.status === 'PROCESSING' ? 'Cancelar e reembolsar' : 'Reembolsar'}
            </Button>
          )}
        </div>
      )}

      <p role="status" className="text-sm text-sage-600">
        {estado}
      </p>
    </div>
  );
}
