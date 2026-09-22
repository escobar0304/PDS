'use client';

import { useEffect, useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, Package, SignOut, User } from '@phosphor-icons/react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { Alert, Card, Container, Input, Spinner, EmptyState } from '@/components/ui';
import { botaoClasses } from '@/components/ui/Button';

type Separador = 'perfil' | 'encomendas' | 'favoritos';

const SEPARADORES: { id: Separador; label: string; Icone: typeof User }[] = [
  { id: 'perfil', label: 'Perfil', Icone: User },
  { id: 'encomendas', label: 'Encomendas', Icone: Package },
  { id: 'favoritos', label: 'Favoritos', Icone: Heart },
];

export default function AreaPessoal() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [separador, setSeparador] = useState<Separador>('perfil');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/area-pessoal');
    }
  }, [status, router]);

  const sair = async () => {
    await signOut({ callbackUrl: '/' });
  };

  if (status === 'loading') {
    return (
      <>
        <Header />
        <main id="conteudo" className="flex min-h-screen items-center justify-center bg-surface py-12">
          <Spinner label="A carregar a sua área pessoal" />
        </main>
        <Footer />
      </>
    );
  }

  if (!session) return null;

  return (
    <>
      <Header />

      <main id="conteudo" className="min-h-screen bg-surface py-8 md:py-12">
        <Container>
          <h1 className="mb-8 font-serif text-3xl text-rose-700 md:text-4xl">Área pessoal</h1>

          <div className="grid gap-6 md:gap-8 lg:grid-cols-4">
            <aside className="lg:col-span-1">
              <Card className="space-y-1 p-3">
                {SEPARADORES.map(({ id, label, Icone }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSeparador(id)}
                    aria-current={separador === id ? 'page' : undefined}
                    className={`flex w-full items-center gap-3 rounded px-4 py-3 text-left transition-smooth ${
                      separador === id
                        ? 'bg-rose-700 text-surface'
                        : 'text-ink-muted hover:bg-surface-sunken hover:text-ink'
                    }`}
                  >
                    <Icone className="h-5 w-5" aria-hidden />
                    <span className="font-medium">{label}</span>
                  </button>
                ))}

                <button
                  type="button"
                  onClick={sair}
                  className="flex w-full items-center gap-3 rounded px-4 py-3 text-left text-danger-700 transition-smooth hover:bg-danger-100"
                >
                  <SignOut className="h-5 w-5" aria-hidden />
                  <span className="font-medium">Sair</span>
                </button>
              </Card>
            </aside>

            <div className="lg:col-span-3">
              {separador === 'perfil' && (
                <Card className="p-6 shadow-soft md:p-8">
                  <h2 className="mb-6 font-serif text-2xl text-rose-700">Informações pessoais</h2>

                  <div className="space-y-4">
                    <Input
                      label="Nome"
                      name="nome"
                      type="text"
                      value={session.user?.name ?? ''}
                      readOnly
                      hint="Para alterar o nome, contacte-nos."
                    />
                    <Input
                      label="Email"
                      name="email"
                      type="email"
                      value={session.user?.email ?? ''}
                      readOnly
                      hint="O email identifica a conta e não pode ser alterado aqui."
                    />
                  </div>

                  <Alert tone="info" className="mt-6">
                    A morada de envio e os dados de faturação são pedidos na finalização da
                    compra. Guardá-los na conta fica disponível quando a loja abrir.
                  </Alert>
                </Card>
              )}

              {separador === 'encomendas' && (
                <EmptyState
                  icon={<Package className="h-10 w-10" />}
                  title="Ainda não tem encomendas"
                  description="Assim que fizer a primeira compra, o histórico aparece aqui."
                  action={
                    <Link href="/loja" className={botaoClasses()}>
                      Ver a loja
                    </Link>
                  }
                />
              )}

              {separador === 'favoritos' && (
                <EmptyState
                  icon={<Heart className="h-10 w-10" />}
                  title="Ainda não tem favoritos"
                  description="Guarde aqui as peças que quer rever mais tarde."
                  action={
                    <Link href="/loja" className={botaoClasses()}>
                      Explorar peças
                    </Link>
                  }
                />
              )}
            </div>
          </div>
        </Container>
      </main>

      <Footer />
    </>
  );
}
