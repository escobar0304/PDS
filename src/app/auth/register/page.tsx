'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { Check, User, Mail, Lock } from 'lucide-react';

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
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validação
    if (formData.password !== formData.confirmPassword) {
      setError('As passwords não coincidem');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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

      // Fazer login automático após registo
      setTimeout(async () => {
        await signIn('credentials', {
          redirect: false,
          email: formData.email,
          password: formData.password,
        });
        router.push('/area-pessoal');
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signIn('google', { callbackUrl: '/area-pessoal' });
    } catch (err) {
      setError('Erro ao fazer registo com Google');
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (success) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-surface py-12 flex items-center">
          <div className="container-custom">
            <div className="max-w-md mx-auto text-center">
              <Check className="mx-auto mb-6 h-12 w-12 text-sage-600" aria-hidden />
              <h1 className="text-3xl font-serif text-rose-700 mb-4">
                Conta criada com sucesso!
              </h1>
              <p className="text-ink-muted mb-6">
                A redirecionar para a sua área pessoal...
              </p>
              <div className="loading"></div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      
      <main className="min-h-screen bg-surface py-12">
        <div className="container-custom">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-serif text-rose-700 mb-2">
                Criar Conta
              </h1>
              <p className="text-ink-muted">
                Junte-se a nós na sua jornada espiritual
              </p>
            </div>

            <div className="bg-surface-raised rounded-lg shadow-soft p-6 md:p-8">
              {/* Google Sign In */}
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-6 py-3 border-2 border-line rounded-lg hover:border-rose-700 hover:bg-surface-sunken transition-smooth disabled:opacity-50 mb-6"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="font-medium text-ink">
                  Continuar com Google
                </span>
              </button>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-line"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-surface-raised text-ink-muted">
                    Ou com email
                  </span>
                </div>
              </div>

              {/* Registration Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-4 bg-danger-100 border border-danger-700/25 rounded-lg">
                    <p className="text-sm text-danger-700">{error}</p>
                  </div>
                )}

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-ink mb-2">
                    Nome Completo
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-rose-200" />
                    </div>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-700 focus:border-transparent"
                      placeholder="João Silva"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-ink mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-rose-200" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-700 focus:border-transparent"
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-ink mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-rose-200" />
                    </div>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      minLength={6}
                      className="w-full pl-10 pr-4 py-3 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-700 focus:border-transparent"
                      placeholder="••••••••"
                    />
                  </div>
                  <p className="text-xs text-ink-muted mt-1">
                    Mínimo 6 caracteres
                  </p>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-ink mb-2">
                    Confirmar Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-rose-200" />
                    </div>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      minLength={6}
                      className="w-full pl-10 pr-4 py-3 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-700 focus:border-transparent"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Criando conta...' : 'Criar Conta'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-ink-muted">
                  Já tem conta?{' '}
                  <Link
                    href="/auth/login"
                    className="text-rose-700 font-medium hover:underline"
                  >
                    Entrar
                  </Link>
                </p>
              </div>

              <div className="mt-6 text-xs text-center text-ink-muted">
                Ao criar uma conta, concorda com os nossos{' '}
                <Link href="/termos" className="text-rose-700 hover:underline">
                  Termos e Condições
                </Link>{' '}
                e{' '}
                <Link href="/privacidade" className="text-rose-700 hover:underline">
                  Política de Privacidade
                </Link>
              </div>
            </div>

            <div className="mt-6 text-center text-sm text-ink-muted">
              <Link href="/" className="hover:text-rose-700 transition-smooth">
                ← Voltar à Loja
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}