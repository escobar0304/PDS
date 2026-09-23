'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, Envelope, Lock, User } from '@phosphor-icons/react';
import AuthShell, { EntrarComGoogle } from '@/components/ui/AuthShell';
import { Alert, Button, Input, Spinner } from '@/components/ui';

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [erroConfirmacao, setErroConfirmacao] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErroConfirmacao('');

    if (formData.password !== formData.confirmPassword) {
      setErroConfirmacao('As passwords não coincidem');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar conta');
      }

      setSuccess(true);

      // Login automatico apos o registo.
      setTimeout(async () => {
        await signIn('credentials', {
          redirect: false,
          email: formData.email,
          password: formData.password,
        });
        router.push('/area-pessoal');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signIn('google', { callbackUrl: '/area-pessoal' });
    } catch {
      setError('Erro ao fazer registo com Google');
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (success) {
    return (
      <AuthShell title="Conta criada" lead="A entrar na sua área pessoal…">
        <div className="text-center">
          <Check className="mx-auto mb-4 h-12 w-12 text-sage-600" aria-hidden />
          <Spinner label="A entrar" />
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Criar conta"
      lead="Guarde as suas encomendas e acompanhe os envios"
      rodape={
        <>
          <p className="text-ink-muted">
            Já tem conta?{' '}
            <Link href="/auth/login" className="font-medium text-rose-700 underline decoration-rose-700/40 underline-offset-2 transition-smooth hover:decoration-rose-700">
              Entrar
            </Link>
          </p>
          <p className="mt-4 text-xs text-ink-muted">
            Ao criar uma conta, concorda com os nossos{' '}
            <Link href="/termos" className="text-rose-700 underline decoration-rose-700/40 underline-offset-2 transition-smooth hover:decoration-rose-700">
              Termos e Condições
            </Link>{' '}
            e a{' '}
            <Link href="/privacidade" className="text-rose-700 underline decoration-rose-700/40 underline-offset-2 transition-smooth hover:decoration-rose-700">
              Política de Privacidade
            </Link>
            .
          </p>
        </>
      }
    >
      <EntrarComGoogle onClick={handleGoogleSignIn} disabled={loading} />

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert tone="erro">{error}</Alert>}

        <Input
          label="Nome"
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          autoComplete="name"
          placeholder="O seu nome"
          icon={<User className="h-5 w-5" />}
        />

        <Input
          label="Email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          autoComplete="email"
          placeholder="seu@email.com"
          icon={<Envelope className="h-5 w-5" />}
        />

        <Input
          label="Password"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
          minLength={6}
          autoComplete="new-password"
          placeholder="••••••••"
          hint="Mínimo de 6 caracteres"
          icon={<Lock className="h-5 w-5" />}
        />

        <Input
          label="Confirmar password"
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
          minLength={6}
          autoComplete="new-password"
          placeholder="••••••••"
          error={erroConfirmacao}
          icon={<Lock className="h-5 w-5" />}
        />

        <Button type="submit" fullWidth loading={loading}>
          {loading ? 'A criar conta…' : 'Criar conta'}
        </Button>
      </form>
    </AuthShell>
  );
}
