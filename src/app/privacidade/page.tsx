import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { Alert, Container, PageHeader } from '@/components/ui';
import { camposEmFalta, EMPRESA, moradaFormatada } from '@/lib/empresa';

export const metadata: Metadata = {
  title: 'Política de privacidade',
  description:
    'Que dados pessoais a Pétalas de Sonho recolhe, para que servem, quanto tempo ficam guardados e que direitos tem sobre eles.',
};

/**
 * As finalidades e as categorias de dados nao foram copiadas de um modelo:
 * saem do que o codigo faz. O registo de conta grava o que esta no
 * `userSchema`; o formulario de contacto envia dois emails e nao guarda nada;
 * o carrinho nunca sai do browser. Se o codigo mudar, esta tabela mente — por
 * isso ha um teste que falha quando o `userSchema` ganha campos novos.
 */
const TRATAMENTOS = [
  {
    finalidade: 'Criar e manter a sua conta',
    dados: 'Nome, email e palavra-passe (guardada cifrada, nunca em claro)',
    base: 'Execução de um contrato consigo (art. 6.º, n.º 1, al. b) do RGPD)',
    prazo: 'Enquanto mantiver a conta. Apaga-se quando a apagar.',
  },
  {
    finalidade: 'Mantê-lo autenticado enquanto navega',
    dados: 'Identificador de sessão, e um contador na conta que permite terminá-la em todos os dispositivos',
    base: 'Execução de um contrato consigo',
    prazo: 'Até terminar sessão ou a sessão expirar',
  },
  {
    finalidade: 'Responder-lhe quando nos escreve pelo formulário',
    dados: 'Nome, email, telefone (se o der), assunto e mensagem',
    base: 'Diligências a seu pedido antes da celebração de um contrato, ou o nosso interesse legítimo em responder a quem nos procura',
    prazo:
      'A mensagem não fica guardada em base de dados: chega-nos por email e vive na caixa de correio o tempo necessário para tratar o assunto',
  },
] as const;

function Linha({ etiqueta, valor }: { etiqueta: string; valor: string | null }) {
  return (
    <div className="flex flex-wrap gap-x-2 py-1">
      <dt className="font-medium text-ink">{etiqueta}:</dt>
      <dd className={valor ? 'text-ink-muted' : 'text-danger-700'}>
        {valor ?? 'por preencher'}
      </dd>
    </div>
  );
}

export default function PrivacidadePage() {
  const faltam = camposEmFalta();

  return (
    <>
      <Header />

      <main id="conteudo" className="min-h-screen bg-surface py-12">
        <Container>
          <div className="mx-auto max-w-3xl">
            <PageHeader
              title="Política de privacidade"
              lead="Que dados recolhemos, para que servem, quanto tempo ficam e o que pode fazer quanto a isso."
              align="left"
            />

            <div className="mt-10 space-y-10 text-ink">
              {faltam.length > 0 && (
                <Alert tone="erro">
                  <p className="font-medium">Esta política ainda não está completa.</p>
                  <p className="mt-1">
                    Faltam os dados de identificação do responsável pelo tratamento. Enquanto
                    faltarem, o sítio está bloqueado aos motores de busca e não deve ser
                    divulgado.
                  </p>
                </Alert>
              )}

              <section>
                <h2 className="mb-3 font-serif text-2xl text-rose-700">
                  Quem trata os seus dados
                </h2>
                <dl className="text-sm">
                  <Linha etiqueta="Responsável" valor={EMPRESA.denominacao} />
                  <Linha etiqueta="NIF" valor={EMPRESA.nif} />
                  <Linha etiqueta="Morada" valor={moradaFormatada()} />
                  <Linha etiqueta="Email" valor={EMPRESA.email} />
                  <Linha etiqueta="Telefone" valor={EMPRESA.telefone} />
                </dl>
              </section>

              <section>
                <h2 className="mb-4 font-serif text-2xl text-rose-700">
                  O que recolhemos e porquê
                </h2>

                <div className="space-y-6">
                  {TRATAMENTOS.map((t) => (
                    <div key={t.finalidade} className="rounded-lg border border-line p-5">
                      <h3 className="font-medium text-ink">{t.finalidade}</h3>
                      <dl className="mt-3 space-y-2 text-sm">
                        <div>
                          <dt className="text-ink-muted">Dados</dt>
                          <dd className="mt-0.5">{t.dados}</dd>
                        </div>
                        <div>
                          <dt className="text-ink-muted">Fundamento legal</dt>
                          <dd className="mt-0.5">{t.base}</dd>
                        </div>
                        <div>
                          <dt className="text-ink-muted">Durante quanto tempo</dt>
                          <dd className="mt-0.5">{t.prazo}</dd>
                        </div>
                      </dl>
                    </div>
                  ))}
                </div>

                <p className="mt-5 leading-relaxed text-ink-muted">
                  Não usamos os seus dados para publicidade, não traçamos perfis e não
                  tomamos decisões automatizadas sobre si. O que põe no carrinho fica no seu
                  navegador e não nos chega enquanto não fizer uma encomenda — hoje a loja
                  ainda não aceita encomendas.
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-serif text-2xl text-rose-700">Com quem partilhamos</h2>
                <p className="leading-relaxed text-ink-muted">
                  Não vendemos nem cedemos os seus dados a ninguém. Para o sítio funcionar
                  recorremos a fornecedores que tratam dados por nossa conta e segundo as
                  nossas instruções: quem aloja o sítio, quem aloja a base de dados e quem
                  entrega o correio eletrónico. Estão todos obrigados por contrato a usar os
                  dados só para isso.
                </p>
                <p className="mt-3 leading-relaxed text-ink-muted">
                  Quando a loja passar a aceitar pagamentos, o processador de pagamentos
                  junta-se a esta lista e esta página é atualizada antes disso acontecer.
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-serif text-2xl text-rose-700">Os seus direitos</h2>
                <p className="leading-relaxed text-ink-muted">
                  Sobre os dados que temos a seu respeito, pode pedir para os ver, corrigir,
                  apagar, limitar o que fazemos com eles, recebê-los num formato que possa
                  levar para outro lado, ou opor-se ao tratamento. Não lhe custa nada e não
                  precisa de justificar.
                </p>
                <p className="mt-3 leading-relaxed text-ink-muted">
                  Escreva-nos{' '}
                  {EMPRESA.email ? (
                    <a href={`mailto:${EMPRESA.email}`} className="text-rose-700 underline decoration-rose-700/40 underline-offset-2 transition-smooth hover:decoration-rose-700">
                      para {EMPRESA.email}
                    </a>
                  ) : (
                    <span className="text-danger-700">(endereço por preencher)</span>
                  )}{' '}
                  ou pelo{' '}
                  <Link href="/sobre-nos" className="text-rose-700 underline decoration-rose-700/40 underline-offset-2 transition-smooth hover:decoration-rose-700">
                    formulário de contacto
                  </Link>
                  . Respondemos no prazo de um mês.
                </p>
                <p className="mt-3 leading-relaxed text-ink-muted">
                  Se achar que tratámos mal os seus dados, pode apresentar reclamação à
                  autoridade de controlo: a{' '}
                  <a
                    href="https://www.cnpd.pt"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-rose-700 underline decoration-rose-700/40 underline-offset-2 transition-smooth hover:decoration-rose-700"
                  >
                    Comissão Nacional de Proteção de Dados
                  </a>
                  .
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-serif text-2xl text-rose-700">
                  Cookies e o que fica no seu equipamento
                </h2>
                <p className="leading-relaxed text-ink-muted">
                  Está tratado à parte, com o inventário completo, na página de{' '}
                  <Link href="/cookies" className="text-rose-700 underline decoration-rose-700/40 underline-offset-2 transition-smooth hover:decoration-rose-700">
                    cookies e armazenamento local
                  </Link>
                  .
                </p>
              </section>

              <Alert tone="info">
                Esta política descreve o que o sítio faz hoje, verificado contra o código. À
                medida que a loja ganhar funcionalidades — encomendas, pagamentos, envios —
                é atualizada antes de essas funcionalidades entrarem em funcionamento.
              </Alert>
            </div>
          </div>
        </Container>
      </main>

      <Footer />
    </>
  );
}
