'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ShoppingBag } from '@phosphor-icons/react';
import Footer from '@/components/footer';
import Header from '@/components/header';
import { mensagemDoProblema } from '@/components/checkout/problemas';
import { Alert, Button, Card, Container, Input, LIGACAO_EM_TEXTO, PageHeader, Skeleton } from '@/components/ui';
import { botaoClasses } from '@/components/ui/Button';
import { useCart } from '@/contexts/CartContext';
import type { Calculo, Problema } from '@/lib/encomenda';
import { formatarPreco } from '@/lib/dinheiro';
import { esquemaCliente, type DadosDoCliente } from '@/lib/validacao';

/** O que a lei pede que se diga antes do botao, lido no servidor. */
export interface InformacaoPrevia {
  ensaio: boolean;
  prazoEntrega: string;
  zonaEnvio: string;
  transportadora: string;
  meiosPagamento: readonly string[];
  minutosParaPagar: number;
  livreResolucaoDias: number;
  devolucaoPagaPeloCliente: boolean;
  garantiaAnos: number;
  vendedor: {
    denominacao: string | null;
    morada: string | null;
    email: string | null;
    telefone: string | null;
  };
}

type Campo = keyof DadosDoCliente;

/** O que se diz em cada campo quando nao passa no `esquemaCliente`. */
const MENSAGENS: Record<Campo, string> = {
  nome: 'Falta o nome.',
  email: 'Escreva um email válido, como nome@exemplo.pt.',
  telefone: 'Um telefone com 9 dígitos, ou com o indicativo do país.',
  morada: 'Falta a morada.',
  codigoPostal: 'Um código postal do continente, como 4000-123: só enviamos para Portugal continental.',
  localidade: 'Falta a localidade.',
};

const VAZIO: Record<Campo, string> = {
  nome: '',
  email: '',
  telefone: '',
  morada: '',
  codigoPostal: '',
  localidade: '',
};

type Orcamento =
  | { estado: 'a-calcular' }
  | { estado: 'pronto'; calculo: Extract<Calculo, { ok: true }> }
  | { estado: 'problemas'; problemas: Problema[] }
  | { estado: 'erro' };

type Linha = { id: string; varianteId: string; quantidade: number };

/** O total, pedido ao servidor. Nunca lanca: um erro e um estado da pagina. */
async function pedirOrcamento(linhas: Linha[]): Promise<Orcamento> {
  try {
    const r = await fetch('/api/encomendas/orcamento', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ linhas }),
    });
    if (!r.ok) return { estado: 'erro' };
    const c = (await r.json()) as Calculo;
    return c.ok ? { estado: 'pronto', calculo: c } : { estado: 'problemas', problemas: c.problemas };
  } catch {
    return { estado: 'erro' };
  }
}

function Falta() {
  return <span className="text-danger-700">por preencher</span>;
}

/**
 * O checkout (ROADMAP-V2, E5): os dados de entrega, o resumo com portes e
 * total, a informacao que a lei pede, e o botao.
 *
 * **Nada aqui decide nada.** O total vem do servidor
 * (`/api/encomendas/orcamento`), e volta a ser calculado quando se encomenda;
 * o formulario corre o mesmo `esquemaCliente` que o servidor so para dizer o
 * que falta campo a campo. O que conta e o que o servidor responde.
 */
export default function Checkout({ informacao }: { informacao: InformacaoPrevia }) {
  const { items, pronto } = useCart();
  const [dados, setDados] = useState(VAZIO);
  const [erros, setErros] = useState<Partial<Record<Campo, string>>>({});
  const [orcamento, setOrcamento] = useState<Orcamento>({ estado: 'a-calcular' });
  const [erro, setErro] = useState('');
  const [aEnviar, setAEnviar] = useState(false);

  const linhas = useMemo(
    () => items.map((i) => ({ id: i._id, varianteId: i.varianteId, quantidade: i.quantity })),
    [items]
  );
  const chaveDoPedido = JSON.stringify(linhas);

  useEffect(() => {
    if (!pronto || linhas.length === 0) return;
    let atual = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- o total e de outro sistema (o servidor)
    setOrcamento({ estado: 'a-calcular' });
    pedirOrcamento(linhas).then((o) => atual && setOrcamento(o));
    return () => {
      atual = false;
    };
    // `linhas` muda de identidade a cada render do contexto; o que conta e o conteudo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pronto, chaveDoPedido]);

  const mudar = (campo: Campo) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDados((d) => ({ ...d, [campo]: e.target.value }));

  const encomendar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    if (orcamento.estado !== 'pronto') return;

    const r = esquemaCliente.safeParse(dados);
    if (!r.success) {
      const novos: Partial<Record<Campo, string>> = {};
      for (const issue of r.error.issues) {
        const campo = issue.path[0] as Campo;
        novos[campo] = MENSAGENS[campo];
      }
      setErros(novos);
      // O primeiro campo com erro recebe o foco, para quem usa teclado ou
      // leitor de ecra nao ter de o procurar.
      const primeiro = (Object.keys(VAZIO) as Campo[]).find((c) => novos[c]);
      if (primeiro) document.getElementById(`campo-${primeiro}`)?.focus();
      return;
    }
    setErros({});

    setAEnviar(true);
    try {
      const resposta = await fetch('/api/encomendas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          linhas,
          cliente: r.data,
          entrega: 'SHIPPING',
          totalVistoCents: orcamento.calculo.totalCents,
        }),
      });
      const corpo = (await resposta.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
        problemas?: Problema[];
      };

      if (resposta.status === 201 && corpo.url) {
        // Para a pagina da Stripe. O botao fica ocupado ate a pagina mudar.
        window.location.assign(corpo.url);
        return;
      }
      if (resposta.status === 409 && corpo.problemas) {
        const mudou = corpo.problemas.find((p) => p.tipo === 'total-mudou');
        if (mudou) {
          // O novo total tem de ser visto antes de se poder encomendar outra
          // vez: pede-se de novo, e o botao so volta com ele no ecra.
          setErro(mensagemDoProblema(mudou, items));
          setOrcamento({ estado: 'a-calcular' });
          setOrcamento(await pedirOrcamento(linhas));
        } else {
          setOrcamento({ estado: 'problemas', problemas: corpo.problemas });
        }
      } else {
        setErro(corpo.error ?? 'Não foi possível fazer a encomenda. Tente outra vez.');
      }
    } catch {
      setErro('Sem ligação. Verifique a internet e tente outra vez.');
    }
    setAEnviar(false);
  };

  if (pronto && items.length === 0) {
    return (
      <>
        <Header />
        <main id="conteudo" className="min-h-screen bg-surface py-16">
          <Container className="max-w-2xl text-center">
            <ShoppingBag className="mx-auto mb-6 h-16 w-16 text-ink-muted/50" aria-hidden />
            <PageHeader title="Finalizar encomenda" lead="O carrinho está vazio." />
            <Link href="/loja" className={botaoClasses({ className: 'mt-8' })}>
              Ir às compras
            </Link>
          </Container>
        </main>
        <Footer />
      </>
    );
  }

  const { vendedor } = informacao;
  const pronta = orcamento.estado === 'pronto';

  return (
    <>
      <Header />
      <main id="conteudo" className="min-h-screen bg-surface py-8 md:py-12">
        <Container>
          <PageHeader title="Finalizar encomenda" align="left" />

          {informacao.ensaio && (
            <Alert tone="info" className="mt-6">
              <strong>Ensaio.</strong> Os portes e o prazo desta página são inventados, para testar a
              loja, e o pagamento é o de testes da Stripe: nada é cobrado nem enviado.
            </Alert>
          )}

          <form onSubmit={encomendar} noValidate className="mt-8 grid gap-8 lg:grid-cols-5">
            <section aria-labelledby="dados" className="space-y-4 lg:col-span-3">
              <h2 id="dados" className="font-serif text-2xl text-rose-700">
                Os seus dados
              </h2>
              <p className="text-sm text-ink-muted">
                Não precisa de conta. Usamos estes dados para a entrega e para lhe escrever sobre a
                encomenda — ver a{' '}
                <Link href="/privacidade" className={LIGACAO_EM_TEXTO}>
                  política de privacidade
                </Link>
                .
              </p>
              <Input label="Nome" name="nome" autoComplete="name" value={dados.nome} error={erros.nome} onChange={mudar('nome')} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={dados.email}
                  error={erros.email}
                  onChange={mudar('email')}
                />
                <Input
                  label="Telefone"
                  name="telefone"
                  type="tel"
                  autoComplete="tel"
                  hint="Para os CTT avisarem da entrega"
                  value={dados.telefone}
                  error={erros.telefone}
                  onChange={mudar('telefone')}
                />
              </div>
              <Input
                label="Morada"
                name="morada"
                autoComplete="street-address"
                value={dados.morada}
                error={erros.morada}
                onChange={mudar('morada')}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Código postal"
                  name="codigoPostal"
                  autoComplete="postal-code"
                  inputMode="numeric"
                  hint={`Só enviamos para ${informacao.zonaEnvio}`}
                  value={dados.codigoPostal}
                  error={erros.codigoPostal}
                  onChange={mudar('codigoPostal')}
                />
                <Input
                  label="Localidade"
                  name="localidade"
                  autoComplete="address-level2"
                  value={dados.localidade}
                  error={erros.localidade}
                  onChange={mudar('localidade')}
                />
              </div>
            </section>

            <div className="space-y-6 lg:col-span-2">
              <Card className="p-6">
                <section aria-labelledby="resumo">
                  <h2 id="resumo" className="mb-4 font-serif text-2xl text-rose-700">
                    A encomenda
                  </h2>

                  {orcamento.estado === 'a-calcular' && (
                    <div className="space-y-3" aria-busy="true">
                      <p className="sr-only" role="status">
                        A calcular o total.
                      </p>
                      <Skeleton className="h-5 w-full" />
                      <Skeleton className="h-5 w-2/3" />
                      <Skeleton className="h-8 w-1/2" />
                    </div>
                  )}

                  {orcamento.estado === 'erro' && (
                    <Alert tone="erro">Não foi possível calcular o total. Recarregue a página.</Alert>
                  )}

                  {orcamento.estado === 'problemas' && (
                    <Alert tone="erro">
                      <p>Há coisas a corrigir no carrinho antes de encomendar:</p>
                      <ul className="mt-2 list-disc space-y-1 pl-5">
                        {orcamento.problemas.map((p, i) => (
                          <li key={i}>{mensagemDoProblema(p, items)}</li>
                        ))}
                      </ul>
                      <Link href="/carrinho" className={`mt-3 inline-block ${LIGACAO_EM_TEXTO}`}>
                        Voltar ao carrinho
                      </Link>
                    </Alert>
                  )}

                  {orcamento.estado === 'pronto' && (
                    <>
                      <ul className="space-y-2 border-b border-line pb-4 text-sm">
                        {orcamento.calculo.linhas.map((l) => (
                          <li key={`${l.productId}:${l.varianteId}`} className="flex justify-between gap-4">
                            <span>
                              {l.name}
                              {l.medida && `, medida ${l.medida}`}
                              {l.quantity > 1 && ` × ${l.quantity}`}
                            </span>
                            <span className="tabular whitespace-nowrap">{formatarPreco(l.priceCents * l.quantity)}</span>
                          </li>
                        ))}
                      </ul>
                      <dl className="space-y-2 py-4 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-ink-muted">Peças</dt>
                          <dd className="tabular">{formatarPreco(orcamento.calculo.subtotalCents)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-ink-muted">
                            Portes ({informacao.transportadora}, {(orcamento.calculo.pesoGramas / 1000).toLocaleString('pt-PT')} kg)
                          </dt>
                          <dd className="tabular">{formatarPreco(orcamento.calculo.shippingCents)}</dd>
                        </div>
                        <div className="flex items-baseline justify-between border-t border-line pt-3">
                          <dt className="font-semibold text-ink">Total, com IVA e portes</dt>
                          <dd className="tabular text-2xl font-semibold text-rose-700" data-total>
                            {formatarPreco(orcamento.calculo.totalCents)}
                          </dd>
                        </div>
                      </dl>
                    </>
                  )}
                </section>
              </Card>

              {/*
                O DL 24/2014, art. 4.º, pede isto **imediatamente antes** do
                botao, e nao numa pagina a parte: por isso esta aqui, e nao so
                em /termos.
              */}
              <section aria-labelledby="antes" className="space-y-3 text-sm text-ink-muted">
                <h2 id="antes" className="font-medium text-ink">
                  Antes de encomendar
                </h2>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    Entrega por envio, pelos {informacao.transportadora}, para {informacao.zonaEnvio}. Prazo:{' '}
                    {informacao.prazoEntrega}.
                  </li>
                  <li>
                    Paga-se na página da Stripe
                    {informacao.meiosPagamento.length > 0 && `, por ${informacao.meiosPagamento.join(' ou ')}`}. Tem{' '}
                    {informacao.minutosParaPagar} minutos para pagar; depois disso, a encomenda é cancelada e
                    nada é cobrado.
                  </li>
                  <li>
                    Pode desistir da compra nos {informacao.livreResolucaoDias} dias seguintes a receber a
                    encomenda, sem dar razão
                    {informacao.devolucaoPagaPeloCliente && '; os portes da devolução ficam por sua conta'}. Todas
                    as peças têm {informacao.garantiaAnos} anos de garantia legal.
                  </li>
                  <li>
                    Vende: {vendedor.denominacao ?? <Falta />}, {vendedor.morada ?? <Falta />}.{' '}
                    Contactos: {vendedor.email ?? <Falta />}, {vendedor.telefone ?? <Falta />}.
                  </li>
                </ul>
                <p>
                  Ao encomendar, aceita os{' '}
                  <Link href="/termos" className={LIGACAO_EM_TEXTO}>
                    termos e condições
                  </Link>{' '}
                  e as condições de{' '}
                  <Link href="/envios" className={LIGACAO_EM_TEXTO}>
                    envios e devoluções
                  </Link>
                  .
                </p>
              </section>

              {erro && <Alert tone="erro">{erro}</Alert>}

              {/*
                "Encomenda com obrigacao de pagar": a formula do DL 24/2014,
                art. 5.º, n.º 3. Com "Continuar" ou "Pagar", a pessoa nao
                ficava obrigada. Nao se muda sem mudar a lei.
              */}
              <Button type="submit" size="lg" fullWidth loading={aEnviar} disabled={!pronta}>
                Encomenda com obrigação de pagar
              </Button>
              {pronta && (
                <p className="text-center text-xs text-ink-muted">
                  Vai para a página de pagamento da Stripe. Os dados do cartão nunca passam por este sítio.
                </p>
              )}
            </div>
          </form>
        </Container>
      </main>
      <Footer />
    </>
  );
}
