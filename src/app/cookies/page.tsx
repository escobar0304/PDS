import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/header';
import Footer from '@/components/footer';
import InterruptorMapa from '@/components/interruptorMapa';
import { Alert, Card, Container, PageHeader } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Cookies e armazenamento local',
  description:
    'O que a Pétalas de Sonho guarda no seu equipamento, para que serve e durante quanto tempo.',
};

/**
 * O inventario nao foi copiado de um modelo: foi medido.
 *
 * Carregou-se a versao de producao do site num browser limpo, percorreram-se
 * as paginas publicas e leram-se os cookies, o localStorage, o sessionStorage
 * e os pedidos a dominios externos. O que esta nesta tabela e o que o browser
 * recebeu de facto. O procedimento esta em `docs/COOKIES.md` e ha um teste de
 * ponta a ponta que falha se aparecer alguma coisa nova.
 */
const ITENS = [
  {
    nome: 'next-auth.csrf-token',
    tipo: 'Cookie de sessão',
    fim: 'Impede que outro sítio submeta formulários de autenticação em seu nome.',
    duracao: 'Até fechar o browser',
  },
  {
    nome: 'next-auth.callback-url',
    tipo: 'Cookie de sessão',
    fim: 'Guarda para onde deve ser reencaminhado depois de entrar na conta.',
    duracao: 'Até fechar o browser',
  },
  {
    nome: 'next-auth.session-token',
    tipo: 'Cookie de sessão',
    fim: 'Mantém-no autenticado enquanto navega. Só existe depois de entrar na conta.',
    duracao: 'Até terminar sessão ou expirar',
  },
  {
    nome: 'cart',
    tipo: 'Armazenamento local',
    fim: 'Guarda o que colocou no carrinho para não se perder ao recarregar a página.',
    duracao: 'Até esvaziar o carrinho ou limpar os dados do navegador',
  },
  {
    nome: 'pds.mapa',
    tipo: 'Armazenamento local',
    fim: 'Guarda se escolheu mostrar sempre o mapa da loja. Só existe se ligar essa opção.',
    duracao: 'Até desligar a opção ou limpar os dados do navegador',
  },
  {
    nome: 'nextauth.message',
    tipo: 'Armazenamento local',
    fim: 'Sincroniza o estado da sessão entre separadores abertos do mesmo site.',
    duracao: 'Momentânea',
  },
];

export default function CookiesPage() {
  return (
    <>
      <Header />

      <main id="conteudo" className="min-h-screen bg-surface py-12">
        <Container>
          <div className="mx-auto max-w-3xl">
            <PageHeader
              title="Cookies e armazenamento local"
              lead="O que guardamos no seu equipamento, para que serve e durante quanto tempo."
              align="left"
            />

            <div className="mt-10 space-y-8 text-ink">
              <section>
                <h2 className="mb-3 font-serif text-2xl text-rose-700">
                  Porque é que não há aqui uma barra de cookies
                </h2>
                <p className="leading-relaxed text-ink-muted">
                  A lei exige consentimento para guardar informação no seu equipamento,
                  com uma exceção: o que é estritamente necessário para lhe prestar o
                  serviço que pediu. Este sítio não tem publicidade, não tem análise de
                  tráfego e não partilha nada com terceiros para fins de marketing —
                  tudo o que guardamos cai na exceção.
                </p>
                <p className="mt-3 leading-relaxed text-ink-muted">
                  Há uma única coisa que vem de fora, o mapa da loja, e essa não carrega
                  sem que a peça. Fica em baixo, com o interruptor para a ligar ou
                  desligar quando quiser. Por isso não encontra aqui uma barra a pedir-lhe
                  autorização: seria a fingir uma escolha que, tirando o mapa, não existe.
                </p>
                <p className="mt-3 leading-relaxed text-ink-muted">
                  Se isso mudar, esta página muda primeiro.
                </p>
              </section>

              <section>
                <h2 className="mb-4 font-serif text-2xl text-rose-700">O que guardamos</h2>

                <div
                  className="overflow-x-auto"
                  tabIndex={0}
                  role="region"
                  aria-label="Tabela do que guardamos"
                >
                  <table className="w-full min-w-[34rem] border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-line text-left">
                        <th scope="col" className="py-3 pr-4 font-medium">Nome</th>
                        <th scope="col" className="py-3 pr-4 font-medium">Tipo</th>
                        <th scope="col" className="py-3 pr-4 font-medium">Para que serve</th>
                        <th scope="col" className="py-3 font-medium">Duração</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ITENS.map((item) => (
                        <tr key={item.nome} className="border-b border-line align-top">
                          <td className="py-3 pr-4 font-mono text-xs text-ink">{item.nome}</td>
                          <td className="py-3 pr-4 text-ink-muted">{item.tipo}</td>
                          <td className="py-3 pr-4 text-ink-muted">{item.fim}</td>
                          <td className="py-3 text-ink-muted">{item.duracao}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section>
                <h2 className="mb-3 font-serif text-2xl text-rose-700">O mapa da loja</h2>
                <p className="leading-relaxed text-ink-muted">
                  A página <Link href="/sobre-nos" className="text-rose-700 underline decoration-rose-700/40 underline-offset-2 transition-smooth hover:decoration-rose-700">Sobre Nós</Link>{' '}
                  mostra onde fica a loja num mapa da Google. Esse mapa é a única coisa neste
                  sítio que vem de fora, e por isso{' '}
                  <strong className="font-medium text-ink">não carrega sozinho</strong>: fica
                  um botão no lugar dele.
                </p>
                <p className="mt-3 leading-relaxed text-ink-muted">
                  Carregar num mapa da Google faz o seu navegador contactar a Google, que
                  fica a saber o seu endereço de internet e a página onde está, e pode
                  guardar informação no seu equipamento. Nada disso acontece enquanto não
                  pedir o mapa.
                </p>
                <p className="mt-3 leading-relaxed text-ink-muted">
                  Se preferir não repetir a escolha em cada visita, pode deixá-lo ligado:
                </p>

                <div className="mt-5">
                  <InterruptorMapa />
                </div>
              </section>

              <section>
                <h2 className="mb-3 font-serif text-2xl text-rose-700">Como apagar</h2>
                <p className="leading-relaxed text-ink-muted">
                  Tudo o que está na tabela acima desaparece ao limpar os dados de navegação
                  do seu browser. O carrinho também se esvazia a partir da própria{' '}
                  <Link href="/carrinho" className="text-rose-700 underline decoration-rose-700/40 underline-offset-2 transition-smooth hover:decoration-rose-700">página do carrinho</Link>.
                  Bloquear cookies por completo faz com que não consiga entrar na sua conta,
                  porque é com eles que o site sabe que é você entre uma página e a seguinte.
                </p>
              </section>

              <Alert tone="info">
                Esta página descreve o comportamento técnico do sítio, verificado por
                medição. Não substitui a política de privacidade, que trata dos dados
                pessoais que recolhemos e dos seus direitos sobre eles, e que está a ser
                preparada.
              </Alert>

              <Card className="p-5">
                <p className="text-sm text-ink-muted">
                  Última verificação: 22 de setembro de 2026.
                </p>
              </Card>
            </div>
          </div>
        </Container>
      </main>

      <Footer />
    </>
  );
}
