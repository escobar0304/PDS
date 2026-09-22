'use client';

import { Suspense, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Envelope, Lock } from '@phosphor-icons/react';
import AuthShell, { GoogleButton, Separador } from '@/components/ui/AuthShell';
import { Alert, Button, Input, Spinner } from '@/components/ui';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/area-pessoal';

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });

      if (result?.error) {
        setError('Email ou password incorretos');
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError('Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signIn('google', { callbackUrl });
    } catch {
      setError('Erro ao fazer login com Google');
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <AuthShell
      title="Bem-vindo de volta"
      lead="Entre na sua conta para continuar"
      rodape={
        <p className="text-ink-muted">
          Ainda não tem conta?{' '}
          <Link href="/auth/register" className="font-medium text-rose-700 underline decoration-rose-700/40 underline-offset-2 transition-smooth hover:decoration-rose-700">
            Criar conta
          </Link>
        </p>
      }
    >
      <GoogleButton onClick={handleGoogleSignIn} disabled={loading}>
        Continuar com Google
      </GoogleButton>

      <Separador>Ou com email</Separador>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert tone="erro">{error}</Alert>}

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
          autoComplete="current-password"
          placeholder="••••••••"
          icon={<Lock className="h-5 w-5" />}
        />

        <div className="text-right text-sm">
          <Link
            href="/auth/recuperar-password"
            className="inline-block py-1.5 text-rose-700 underline decoration-rose-700/40 underline-offset-2 transition-smooth hover:decoration-rose-700"
          >
            Esqueci a password
          </Link>
        </div>

        <Button type="submit" fullWidth loading={loading}>
          {loading ? 'A entrar…' : 'Entrar'}
        </Button>
      </form>
    </AuthShell>
  );
}

/**
 * useSearchParams() (callbackUrl) obriga a um limite de Suspense no App Router.
 */
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <AuthShell title="Bem-vindo de volta">
          <Spinner label="A preparar o formulário" />
        </AuthShell>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
