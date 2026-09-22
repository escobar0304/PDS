'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock } from '@phosphor-icons/react';
import AuthShell from '@/components/ui/AuthShell';
import { Alert, Button, Input, Spinner } from '@/components/ui';
import { botaoClasses } from '@/components/ui/Button';

function NovaPasswordConteudo() {
  const router = useRouter();
  const token = useSearchParams().get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [erro, setErro] = useState('');
  const [erroConfirmacao, setErroConfirmacao] = useState('');
  const [loading, setLoading] = useState(false);
  const [pronto, setPronto] = useState(false);

  const submeter = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setErroConfirmacao('');

    if (password !== confirmacao) {
      setErroConfirmacao('As palavras-passe não coincidem');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/nova-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const dados = await res.json();

      if (!res.ok) {
        setErro(dados.error ?? 'Não foi possível alterar a palavra-passe.');
        return;
      }

      setPronto(true);
      setTimeout(() => router.push('/auth/login'), 2500);
    } catch {
      setErro('Não foi possível alterar a palavra-passe.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthShell title="Ligação em falta">
        <Alert tone="erro">
          Esta página só funciona a partir da ligação que enviámos por email.
        </Alert>
        <Link href="/auth/recuperar-password" className={botaoClasses({ className: 'mt-5 w-full' })}>
          Pedir uma ligação nova
        </Link>
      </AuthShell>
    );
  }

  if (pronto) {
    return (
      <AuthShell title="Palavra-passe alterada" lead="A levá-lo para a entrada…">
        <Alert tone="sucesso">Já pode entrar com a palavra-passe nova.</Alert>
        <Spinner label="A encaminhar" />
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Definir palavra-passe" lead="Escolha uma palavra-passe nova para a sua conta.">
      <form onSubmit={submeter} className="space-y-4">
        {erro && (
          <Alert
            tone="erro"
            action={
              <Link href="/auth/recuperar-password" className={botaoClasses({ variant: 'secondary', size: 'sm' })}>
                Pedir uma ligação nova
              </Link>
            }
          >
            {erro}
          </Alert>
        )}

        <Input
          label="Palavra-passe"
          type="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="••••••••"
          hint="Mínimo de 8 caracteres"
          icon={<Lock className="h-5 w-5" />}
        />

        <Input
          label="Confirmar palavra-passe"
          type="password"
          name="confirmacao"
          value={confirmacao}
          onChange={(e) => setConfirmacao(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="••••••••"
          error={erroConfirmacao}
          icon={<Lock className="h-5 w-5" />}
        />

        <Button type="submit" fullWidth loading={loading}>
          {loading ? 'A guardar…' : 'Guardar palavra-passe'}
        </Button>
      </form>
    </AuthShell>
  );
}

/** useSearchParams() obriga a um limite de Suspense no App Router. */
export default function NovaPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthShell title="Definir palavra-passe">
          <Spinner label="A preparar o formulário" />
        </AuthShell>
      }
    >
      <NovaPasswordConteudo />
    </Suspense>
  );
}
