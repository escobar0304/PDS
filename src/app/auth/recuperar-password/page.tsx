'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Envelope } from '@phosphor-icons/react';
import AuthShell from '@/components/ui/AuthShell';
import { Alert, Button, Input } from '@/components/ui';

export default function RecuperarPasswordPage() {
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const submeter = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro('');

    try {
      const res = await fetch('/api/auth/recuperar-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.status === 429) {
        setErro('Demasiados pedidos. Tente mais tarde.');
        return;
      }
      if (!res.ok) {
        setErro('Não foi possível processar o pedido.');
        return;
      }

      setEnviado(true);
    } catch {
      setErro('Não foi possível processar o pedido.');
    } finally {
      setLoading(false);
    }
  };

  if (enviado) {
    return (
      <AuthShell title="Verifique o seu email">
        {/*
          A mensagem e deliberadamente a mesma exista ou nao a conta. Dizer
          "esse endereco nao existe" entregava a lista de quem tem conta a
          quem estivesse a sondar.
        */}
        <Alert tone="sucesso">
          Se existir uma conta com esse endereço, enviámos uma mensagem com as
          instruções para definir uma palavra-passe nova.
        </Alert>
        <p className="mt-5 text-sm text-ink-muted">
          A ligação é válida durante uma hora. Se não chegar, veja no lixo eletrónico
          antes de pedir outra.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Recuperar a palavra-passe"
      lead="Diga-nos o endereço da conta e enviamos as instruções."
      rodape={
        <p className="text-ink-muted">
          Lembrou-se dela?{' '}
          <Link
            href="/auth/login"
            className="font-medium text-rose-700 underline decoration-rose-700/40 underline-offset-2 transition-smooth hover:decoration-rose-700"
          >
            Entrar
          </Link>
        </p>
      }
    >
      <form onSubmit={submeter} className="space-y-4">
        {erro && <Alert tone="erro">{erro}</Alert>}

        <Input
          label="Email"
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder="seu@email.com"
          icon={<Envelope className="h-5 w-5" />}
        />

        <Button type="submit" fullWidth loading={loading}>
          {loading ? 'A enviar…' : 'Enviar instruções'}
        </Button>
      </form>
    </AuthShell>
  );
}
