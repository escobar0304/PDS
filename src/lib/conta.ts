import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import { Order, Token, User } from '@/lib/models';

/**
 * Os direitos do titular sobre a propria conta.
 *
 * A pagina de privacidade diz, sobre os dados da conta: "Enquanto mantiver a
 * conta. **Apaga-se quando a apagar.**" Ate aqui nao havia forma nenhuma de a
 * apagar. O sitio prometia um direito que nao oferecia — o mesmo erro do
 * rodape que ligava para paginas inexistentes, agora com o RGPD por tras em
 * vez de so a estetica.
 *
 * Isto vive fora das rotas para poder ser exercitado contra uma base de dados
 * a serio em `src/lib/__tests__/integracao.test.ts`. Apagar uma conta e
 * exactamente o tipo de operacao que nao se pode dizer correcta sem a ver
 * correr: sao varias coleccoes, e falhar uma delas deixa dados pessoais para
 * tras sem ninguem reparar.
 */

/** Campos do utilizador que nunca saem, nem para o proprio. */
const NUNCA_EXPORTAR = ['password', '__v'] as const;

export interface DadosExportados {
  geradoEm: string;
  aviso: string;
  conta: Record<string, unknown>;
  encomendas: Record<string, unknown>[];
}

/**
 * Tudo o que a base de dados guarda sobre uma pessoa, menos o que nao deve
 * sair.
 *
 * A palavra-passe cifrada fica de fora. Exportar um hash argon2 nao serve ao
 * titular para nada e, num ficheiro que vai parar aos downloads ou a um email,
 * da a quem o apanhe material para atacar offline. O art. 15.º, n.º 4 do RGPD
 * cobre esta recusa: o direito de acesso nao prejudica direitos de terceiros,
 * e aqui prejudicaria o proprio.
 */
export async function exportarDados(idUtilizador: string): Promise<DadosExportados | null> {
  if (!mongoose.Types.ObjectId.isValid(idUtilizador)) return null;

  await connectDB();

  const utilizador = await User.findById(idUtilizador).lean();
  if (!utilizador) return null;

  const conta = { ...(utilizador as Record<string, unknown>) };
  for (const campo of NUNCA_EXPORTAR) delete conta[campo];

  const encomendas = await Order.find({ userId: idUtilizador }).lean();

  return {
    geradoEm: new Date().toISOString(),
    aviso:
      'Este ficheiro contém os seus dados pessoais. A palavra-passe não é ' +
      'incluída: está guardada cifrada e não é legível nem por nós.',
    conta,
    encomendas: encomendas as unknown as Record<string, unknown>[],
  };
}

export interface ResultadoApagar {
  /** Coleccoes tocadas e quantos registos sairam de cada uma. */
  apagados: Record<string, number>;
}

/**
 * Apaga a conta e tudo o que lhe esta preso.
 *
 * Nao chega apagar o documento em `users`. O adaptador do NextAuth guarda as
 * ligacoes a provedores em `accounts` e as sessoes em `sessions`, com o driver
 * do Mongo e nao pelo Mongoose; e os tokens de verificacao e de reposicao
 * vivem em `tokens`. Deixar qualquer um para tras e deixar dados pessoais para
 * tras, e uma ligacao de reposicao viva para uma conta que ja nao existe.
 *
 * As encomendas **nao** se apagam, e isso e deliberado: ha obrigacao de
 * conservacao fiscal dos documentos de venda que se sobrepoe ao direito ao
 * apagamento (art. 17.º, n.º 3, alinea b) — o tratamento necessario para
 * cumprir uma obrigacao legal. Desligam-se da conta, ficando sem `userId`,
 * para deixarem de ser dados de uma pessoa identificada aqui.
 *
 * Hoje nao ha encomendas nenhumas, mas a regra fica escrita antes de existirem
 * — e mais barato agora do que quando houver.
 */
export async function apagarConta(idUtilizador: string): Promise<ResultadoApagar | null> {
  if (!mongoose.Types.ObjectId.isValid(idUtilizador)) return null;

  await connectDB();

  const utilizador = await User.findById(idUtilizador);
  if (!utilizador) return null;

  const id = new mongoose.Types.ObjectId(idUtilizador);
  const apagados: Record<string, number> = {};

  const encomendas = await Order.updateMany({ userId: id }, { $unset: { userId: '' } });
  apagados.encomendasDesligadas = encomendas.modifiedCount ?? 0;

  const tokens = await Token.deleteMany({ userId: id });
  apagados.tokens = tokens.deletedCount ?? 0;

  // As coleccoes do adaptador nao tem modelo Mongoose. Vao pelo driver.
  const bd = mongoose.connection.db;
  if (bd) {
    for (const nome of ['accounts', 'sessions'] as const) {
      const r = await bd.collection(nome).deleteMany({ userId: id });
      apagados[nome] = r.deletedCount ?? 0;
    }
  }

  await User.deleteOne({ _id: id });
  apagados.utilizador = 1;

  return { apagados };
}
