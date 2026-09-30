import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { paginaComSessao } from '@/lib/autorizacao';
import Declaracao from './conteudo';

export const metadata: Metadata = { title: 'Confirmar a idade' };

/**
 * Só maiores de 18 têm conta. Chega-se aqui pela `paginaComSessao`, quando a
 * conta ainda nao declarou a idade: quem entrou pela Google pela primeira vez,
 * ou uma conta de antes desta regra.
 */
export default async function Pagina() {
  const sessao = await paginaComSessao('/auth/maioridade', { exigirMaioridade: false });
  if (sessao.maior) redirect('/area-pessoal');
  return <Declaracao />;
}
