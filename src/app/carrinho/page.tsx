import { connection } from 'next/server';
import { estadoDaLoja } from '@/lib/loja';
import Carrinho from './conteudo';

/**
 * A porta do carrinho, no servidor: e aqui que se sabe se a loja aceita
 * encomendas (`lib/loja.ts`). O conteudo e de cliente, em `conteudo.tsx`.
 *
 * `desistir` e `chave` chegam quando se volta atras na pagina da Stripe
 * (`lib/pagamento.ts`): o carrinho cancela essa encomenda, e o stock volta.
 * So passam se tiverem a forma certa; o servidor verifica o resto.
 */
export default async function Pagina({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const { desistir, chave } = await searchParams;
  const desistencia =
    typeof desistir === 'string' &&
    typeof chave === 'string' &&
    /^[a-f0-9]{24}$/.test(desistir) &&
    /^[A-Za-z0-9_-]{43}$/.test(chave)
      ? { id: desistir, chave }
      : null;

  return <Carrinho aberta={estadoDaLoja().aberta} desistencia={desistencia} />;
}
