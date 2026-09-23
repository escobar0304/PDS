import { NextResponse } from 'next/server';
import { exigirSessao } from '@/lib/autorizacao';
import { exportarDados } from '@/lib/conta';

/**
 * Direito de acesso e de portabilidade (RGPD, art. 15.º e 20.º).
 *
 * Consulta-se sempre pelo `id` da **sessao**, nunca por um id vindo do pedido.
 * Aceitar `?id=` aqui trocava um direito do titular por um IDOR: qualquer
 * pessoa autenticada descarregaria os dados de qualquer outra.
 */
export async function GET() {
  const permissao = await exigirSessao();
  if (!permissao.ok) return permissao.resposta;

  try {
    const dados = await exportarDados(permissao.sessao.id);

    if (!dados) {
      // A sessao e valida mas a conta ja nao existe: acontece a quem apague a
      // conta e fique com o JWT em maos ate expirar. Ver a divida registada em
      // docs/SEGURANCA.md.
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
    }

    return new NextResponse(JSON.stringify(dados, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        // Formato "estruturado, de uso corrente e de leitura automatica",
        // como o art. 20.º pede. O nome nao leva nada do utilizador: um nome
        // com barras ou aspas no cabecalho e injeccao de cabecalho.
        'Content-Disposition': 'attachment; filename="os-meus-dados.json"',
        // Dados pessoais nao se guardam em cache nenhuma pelo caminho.
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (erro) {
    console.error('Erro ao exportar dados:', erro);
    return NextResponse.json({ error: 'Não foi possível exportar os dados.' }, { status: 500 });
  }
}
