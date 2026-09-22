'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import AuthShell from '@/components/ui/AuthShell';
import { Alert, Spinner } from '@/components/ui';
import { botaoClasses } from '@/components/ui/Button';

type Estado = 'a-verificar' | 'confirmado' | 'falhou';

function VerificarConteudo() {
  const token = useSearchParams().get('token') ?? '';
  const [estado, setEstado] = useState<Estado>('a-verificar');
  const [mensagem, setMensagem] = useState('');

  useEffect(() => {
    if (!token) {
      setEstado('falhou');
      setMensagem('Esta página só funciona a partir da ligação que enviámos por email.');
      return;
    }

    let cancelado = false;

    // POST e nao GET: pre-carregadores de ligacoes e antivirus de correio
    // abrem os URL das mensagens, e com GET gastavam o token antes de a
    // pessoa lhe tocar.
    fetch('/api/auth/verificar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        if (cancelado) return;
        const dados = await res.json();
        if (res.ok) {
          setEstado('confirmado');
        } else {
          setEstado('falhou');
          setMensagem(dados.error ?? 'Não foi possível confirmar o email.');
        }
      })
      .catch(() => {
        if (!cancelado) {
          setEstado('falhou');
          setMensagem('Não foi possível confirmar o email.');
        }
      });

    return () => {
      cancelado = true;
    };
  }, [token]);

  if (estado === 'a-verificar') {
    return (
      <AuthShell title="A confirmar o email">
        <Spinner label="A confirmar" />
      </AuthShell>
    );
  }

  if (estado === 'confirmado') {
    return (
      <AuthShell title="Email confirmado" lead="Obrigado. A sua conta está pronta.">
        <Alert tone="sucesso">O endereço ficou associado à sua conta.</Alert>
        <Link href="/auth/login" className={botaoClasses({ className: 'mt-5 w-full' })}>
          Entrar
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Não foi possível confirmar">
      <Alert tone="erro">{mensagem}</Alert>
      <Link href="/" className={botaoClasses({ variant: 'secondary', className: 'mt-5 w-full' })}>
        Voltar à loja
      </Link>
    </AuthShell>
  );
}

export default function VerificarPage() {
  return (
    <Suspense
      fallback={
        <AuthShell title="A confirmar o email">
          <Spinner label="A confirmar" />
        </AuthShell>
      }
    >
      <VerificarConteudo />
    </Suspense>
  );
}
