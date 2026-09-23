import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import { User } from '@/lib/models';

/**
 * Se uma sessao ainda corresponde a uma conta que a aceita.
 *
 * As sessoes sao JWT: nao ha nada do lado do servidor para apagar, e um token
 * emitido era valido ate expirar, 30 dias depois. Isso queria dizer que
 * apagar a conta ou repor a palavra-passe **nao terminava sessao nenhuma** —
 * quem tivesse o cookie continuava a apresenta-lo.
 *
 * Cada conta tem uma `versaoSessao`. O token leva a versao que tinha quando a
 * pessoa entrou; se a conta deixar de existir, ou a versao mudar (repor a
 * palavra-passe incrementa-a), o token deixa de valer em todos os
 * dispositivos ao mesmo tempo.
 *
 * Tres respostas, e nao duas:
 * - `valida`       — a conta existe e a versao bate certo. Traz o `role`
 *   actual, que o token passa a usar: sem isto, quem perdesse o papel de
 *   administrador continuava administrador ate o token expirar;
 * - `revogada`     — a conta foi apagada ou a sessao revogada;
 * - `desconhecido` — nao foi possivel perguntar (base de dados em baixo).
 *
 * `desconhecido` nao revoga. Com a base de dados em baixo, tudo o que tem
 * dados falha na mesma, por isso manter a sessao nao abre nada; revoga-la
 * expulsava toda a gente por uma falha que nao tem nada a ver com seguranca.
 */
export type EstadoSessao =
  | { estado: 'valida'; role: 'USER' | 'ADMIN' }
  | { estado: 'revogada' }
  | { estado: 'desconhecido' };

export async function verificarSessao(
  idUtilizador: string | undefined,
  versaoDoToken: number | undefined,
): Promise<EstadoSessao> {
  if (!idUtilizador || !mongoose.Types.ObjectId.isValid(idUtilizador)) {
    return { estado: 'revogada' };
  }

  try {
    await connectDB();
    const conta = await User.findById(idUtilizador).select('versaoSessao role').lean();
    if (!conta) return { estado: 'revogada' };
    // Tokens emitidos antes de haver versao, e contas que nunca a mudaram,
    // valem 0 dos dois lados.
    if ((conta.versaoSessao ?? 0) !== (versaoDoToken ?? 0)) return { estado: 'revogada' };
    return { estado: 'valida', role: conta.role };
  } catch {
    return { estado: 'desconhecido' };
  }
}

/** Lancado pelo callback `jwt`; o NextAuth limpa o cookie e a sessao acaba. */
export class SessaoRevogada extends Error {
  constructor() {
    super('Sessão revogada: a conta foi apagada ou a palavra-passe reposta.');
    this.name = 'SessaoRevogada';
  }
}
