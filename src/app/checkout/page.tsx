import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { CONDICOES, PRAZOS_LEGAIS } from '@/lib/condicoes';
import { EMPRESA, moradaFormatada } from '@/lib/empresa';
import { estadoDaLoja } from '@/lib/loja';
import { DURACAO_SESSAO_S } from '@/lib/pagamento';
import Checkout, { type InformacaoPrevia } from './conteudo';

export const metadata: Metadata = {
  title: 'Finalizar encomenda',
  robots: { index: false },
};

/**
 * A porta do checkout, no servidor (ROADMAP-V2, E5).
 *
 * Com a loja fechada, esta pagina **nao existe** — 404, e nao uma pagina a
 * dizer "em breve" (CLAUDE.md). O carrinho so liga para aqui quando abre.
 *
 * Dinamica de proposito: a loja abre ou fecha pelo ambiente (as chaves da
 * Stripe, o ensaio), e uma pagina estatica decidia-o no dia da compilacao.
 */
export default async function Pagina() {
  await connection();
  const loja = estadoDaLoja();
  if (!loja.aberta) notFound();

  // Tudo o que o DL 24/2014, art. 4.º, pede antes do botao, lido das mesmas
  // fontes que /termos e /envios: se mudar la, muda aqui.
  const informacao: InformacaoPrevia = {
    ensaio: loja.ensaio,
    prazoEntrega: loja.condicoes.prazoEntrega,
    zonaEnvio: CONDICOES.zonaEnvio,
    transportadora: CONDICOES.transportadora,
    meiosPagamento: CONDICOES.meiosPagamento ?? [],
    minutosParaPagar: Math.floor(DURACAO_SESSAO_S / 60) - 1,
    livreResolucaoDias: PRAZOS_LEGAIS.livreResolucaoDias,
    devolucaoPagaPeloCliente: CONDICOES.devolucaoPagaPeloCliente,
    garantiaAnos: PRAZOS_LEGAIS.garantiaAnos,
    vendedor: {
      denominacao: EMPRESA.denominacao,
      morada: moradaFormatada(),
      email: EMPRESA.email,
      telefone: EMPRESA.telefone,
    },
  };

  return <Checkout informacao={informacao} />;
}
