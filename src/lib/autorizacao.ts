import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';

/**
 * Guarda de autorizacao para rotas de API.
 *
 * Existe porque `POST /api/categories` criava categorias na base de dados sem
 * verificacao nenhuma: qualquer pessoa na internet podia escrever ali. Nao
 * era uma rota de administracao esquecida atras de uma pagina protegida — o
 * endpoint estava aberto, e a pagina nao e o que protege a API.
 *
 * Rotas de leitura publica nao passam por aqui. Tudo o que escreve, passa.
 */

export interface Sessao {
  id: string;
  email: string;
  role: string;
}

/**
 * Devolve a sessao, ou uma resposta pronta a devolver quando nao ha permissao.
 *
 * O padrao de duas saidas e deliberado: obriga a rota a tratar o caso negativo
 * explicitamente, em vez de o poder ignorar como aconteceria com um valor
 * nulo silencioso.
 */
export async function exigirAdmin(): Promise<
  { ok: true; sessao: Sessao } | { ok: false; resposta: NextResponse }
> {
  const sessao = await getServerSession(authOptions);

  if (!sessao?.user) {
    return {
      ok: false,
      resposta: NextResponse.json({ error: 'Não autenticado' }, { status: 401 }),
    };
  }

  const utilizador = sessao.user as { id?: string; email?: string; role?: string };

  if (utilizador.role !== 'ADMIN') {
    // 403 e nao 404: quem esta autenticado ja sabe que a rota existe, por isso
    // escondê-la nao acrescenta nada e confunde o diagnostico.
    return {
      ok: false,
      resposta: NextResponse.json({ error: 'Sem permissão' }, { status: 403 }),
    };
  }

  return {
    ok: true,
    sessao: {
      id: utilizador.id ?? '',
      email: utilizador.email ?? '',
      role: utilizador.role,
    },
  };
}
