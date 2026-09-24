'use client';

import { useEffect, useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DownloadSimple, Package, ShieldCheck, SignOut, Trash, User } from '@phosphor-icons/react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { Alert, Button, Card, Container, Input, Spinner, EmptyState } from '@/components/ui';
import { botaoClasses } from '@/components/ui/Button';

type Separador = 'perfil' | 'encomendas' | 'dados';

const SEPARADORES: { id: Separador; label: string; Icone: typeof User }[] = [
  { id: 'perfil', label: 'Perfil', Icone: User },
  { id: 'encomendas', label: 'Encomendas', Icone: Package },
  { id: 'dados', label: 'Os seus dados', Icone: ShieldCheck },
];

export default function AreaPessoal() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [separador, setSeparador] = useState<Separador>('perfil');
  const [aApagar, setAApagar] = useState(false);
  const [confirmacao, setConfirmacao] = useState('');
  const [erroDados, setErroDados] = useState('');
  const [ocupado, setOcupado] = useState(false);

  // `null` enquanto a pessoa nao mexer: o campo mostra o nome da sessao.
  const [nome, setNome] = useState<string | null>(null);
  const [erroNome, setErroNome] = useState('');
  const [guardado, setGuardado] = useState(false);
  const [aGuardar, setAGuardar] = useState(false);

  const guardarNome = async (e: React.FormEvent) => {
    e.preventDefault();
    const novo = (nome ?? '').trim();
    setGuardado(false);
    // Feito tambem no servidor. Aqui so poupa um pedido que se sabe perdido.
    if (!novo) {
      setErroNome('Escreva o seu nome.');
      return;
    }
    setAGuardar(true);
    setErroNome('');
    try {
      const r = await fetch('/api/conta', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: novo }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setErroNome(d.error ?? 'Não foi possível guardar.');
        return;
      }
      // O nome da sessao vem do JWT; sem isto o cabecalho mostrava o antigo
      // ate a sessao expirar. O servidor le o nome da base de dados.
      await update();
      setNome(null);
      setGuardado(true);
    } catch {
      setErroNome('Não foi possível guardar.');
    } finally {
      setAGuardar(false);
    }
  };

  /**
   * Quem entrou pela Google nao tem palavra-passe: o callback `signIn` cria
   * essas contas sem ela. Pedir-lhes a palavra-passe seria pedir
   * uma coisa que nunca tiveram, e deixa-las sem forma de apagar a conta.
   * Confirmam escrevendo o proprio email.
   *
   * `null` enquanto nao se sabe — e enquanto nao se sabe nao se pergunta
   * nada, para nao pedir a coisa errada e so depois corrigir.
   */
  const [temPassword, setTemPassword] = useState<boolean | null>(null);

  useEffect(() => {
    if (separador !== 'dados' || temPassword !== null) return;
    let vivo = true;
    fetch('/api/conta')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (vivo && d) setTemPassword(Boolean(d.temPassword));
      })
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, [separador, temPassword]);

  const apagar = async () => {
    setOcupado(true);
    setErroDados('');
    try {
      const corpo = temPassword ? { password: confirmacao } : { confirmacao };
      const r = await fetch('/api/conta', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo),
      });

      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setErroDados(d.error ?? 'Não foi possível apagar a conta.');
        setOcupado(false);
        return;
      }

      // A sessao e um JWT: continua valida ate expirar mesmo sem conta por
      // tras. Terminar a sessao aqui e o que impede a pessoa de ficar a ver
      // uma area pessoal de uma conta que ja nao existe.
      await signOut({ callbackUrl: '/' });
    } catch {
      setErroDados('Não foi possível apagar a conta.');
      setOcupado(false);
    }
  };

  // A porta e o servidor (`page.tsx`). Isto so trata de quem perde a sessao
  // com a pagina aberta — a sessao expira, ou a conta e apagada noutro separador.
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

                  <form onSubmit={guardarNome} noValidate className="space-y-4">
                    <Input
                      label="Nome"
                      name="nome"
                      type="text"
                      autoComplete="name"
                      maxLength={120}
                      value={nome ?? session.user?.name ?? ''}
                      onChange={(e) => {
                        setNome(e.target.value);
                        setGuardado(false);
                      }}
                      error={erroNome || undefined}
                    />
                    <div className="flex items-center gap-4">
                      <Button
                        type="submit"
                        loading={aGuardar}
                        disabled={nome === null || nome.trim() === (session.user?.name ?? '')}
                      >
                        Guardar o nome
                      </Button>
                      {/* Montado sempre: uma regiao de estado que so aparece com a
                          mensagem nao e anunciada de forma fiavel (4.1.3). */}
                      <p role="status" className="text-sm text-ink-muted">
                        {guardado ? 'O nome foi guardado.' : ''}
                      </p>
                    </div>
                  </form>

                  <div className="mt-6 space-y-4">
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

              {separador === 'dados' && (
                <div className="space-y-6">
                  <Card className="p-6 shadow-soft md:p-8">
                    <h2 className="mb-2 font-serif text-2xl text-rose-700">
                      Descarregar os seus dados
                    </h2>
                    <p className="mb-6 text-ink-muted">
                      Um ficheiro com tudo o que guardamos sobre si, num formato que pode
                      levar para outro lado. A palavra-passe não vai incluída: está
                      cifrada e não é legível nem por nós.
                    </p>
                    <a
                      href="/api/conta/dados"
                      download="os-meus-dados.json"
                      className={botaoClasses({ variant: 'secondary' })}
                    >
                      <DownloadSimple className="mr-2 h-5 w-5" aria-hidden />
                      Descarregar
                    </a>
                  </Card>

                  <Card className="border-danger-700/30 p-6 shadow-soft md:p-8">
                    <h2 className="mb-2 font-serif text-2xl text-danger-700">Apagar a conta</h2>
                    <p className="mb-6 text-ink-muted">
                      Apaga a sua conta e os dados pessoais associados. Não há forma de
                      voltar atrás.
                    </p>

                    {!aApagar ? (
                      <Button
                        variant="danger"
                        onClick={() => {
                          setAApagar(true);
                          setErroDados('');
                        }}
                      >
                        <Trash className="mr-2 h-5 w-5" aria-hidden />
                        Quero apagar a conta
                      </Button>
                    ) : temPassword === null ? (
                      <Spinner label="A preparar a confirmação" />
                    ) : (
                      <div className="space-y-4">
                        {erroDados && <Alert tone="erro">{erroDados}</Alert>}

                        {/*
                          A confirmacao muda conforme a conta. Com palavra-passe,
                          prova-se posse do segredo. Sem ela — contas da Google —
                          escreve-se o email: nao prova posse, prova intencao, que
                          e o que esta confirmacao existe para garantir.
                        */}
                        <Input
                          label={
                            temPassword
                              ? 'Confirme com a sua palavra-passe'
                              : 'Escreva o seu email para confirmar'
                          }
                          name={temPassword ? 'password-apagar' : 'email-apagar'}
                          type={temPassword ? 'password' : 'email'}
                          value={confirmacao}
                          onChange={(e) => setConfirmacao(e.target.value)}
                          autoComplete={temPassword ? 'current-password' : 'email'}
                          hint={
                            temPassword
                              ? undefined
                              : `A conta é ${session.user?.email ?? ''}.`
                          }
                        />

                        <div className="flex flex-wrap gap-3">
                          <Button
                            variant="danger"
                            onClick={apagar}
                            disabled={ocupado || confirmacao.trim() === ''}
                          >
                            {ocupado ? 'A apagar…' : 'Apagar definitivamente'}
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setAApagar(false);
                              setConfirmacao('');
                              setErroDados('');
                            }}
                            disabled={ocupado}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>

                  <Alert tone="info">
                    Os restantes direitos — corrigir, limitar ou opor-se ao tratamento —
                    exercem-se pelos{' '}
                    <Link
                      href="/contacto"
                      className="font-medium underline decoration-current/40 underline-offset-2"
                    >
                      contactos
                    </Link>
                    . A{' '}
                    <Link
                      href="/privacidade"
                      className="font-medium underline decoration-current/40 underline-offset-2"
                    >
                      política de privacidade
                    </Link>{' '}
                    explica cada um.
                  </Alert>
                </div>
              )}

            </div>
          </div>
        </Container>
      </main>

      <Footer />
    </>
  );
}
