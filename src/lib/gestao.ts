import mongoose from 'mongoose';
import type { z } from 'zod';
import connectDB from '@/lib/db';
import { problemasDasMedidas, type ProblemaCatalogo } from '@/lib/catalogo';
import { Category, MovimentoStock, Order, Product, User } from '@/lib/models';
import { moverStock } from '@/lib/stock';
import type {
  esquemaEdicaoCategoria,
  esquemaEdicaoProduto,
  esquemaMovimento,
  esquemaNovoProduto,
} from '@/lib/validacao';

/**
 * As operacoes do painel de gestao (ROADMAP-V2, C3).
 *
 * As rotas de `/api/admin` so fazem tres coisas: exigir administrador,
 * limitar pedidos e validar o corpo. O resto esta aqui, onde os testes de
 * integracao o chamam sem HTTP pelo meio. Quem chama ja validou os dados com
 * os esquemas de `validacao.ts`; o que depende da base de dados — a categoria
 * existir, o slug estar livre, as medidas cumprirem a regra da categoria — e
 * verificado aqui.
 */

type NovoProduto = z.infer<typeof esquemaNovoProduto>;
type EdicaoProduto = z.infer<typeof esquemaEdicaoProduto>;
type Movimento = z.infer<typeof esquemaMovimento>;
type EdicaoCategoria = z.infer<typeof esquemaEdicaoCategoria>;

export type Recusa =
  | { erro: 'nao-existe' }
  | { erro: 'categoria-inexistente' }
  | { erro: 'slug-repetido' }
  | { erro: 'medidas'; problemas: ProblemaCatalogo[] }
  | { erro: 'medida-removida' }
  | { erro: 'sem-stock'; disponivel: number }
  | { erro: 'acima-do-maximo' }
  | { erro: 'produtos-incompativeis'; produtos: string[] };

export type Resultado<T = object> = ({ ok: true } & T) | ({ ok: false } & Recusa);

const recusa = <R extends Recusa>(r: R): { ok: false } & R => ({ ok: false, ...r });

function eDuplicado(erro: unknown): boolean {
  return (erro as { code?: number })?.code === 11000;
}

// ============================================
// PRODUTOS
// ============================================

/**
 * Cria o produto com stock 0 e regista o stock inicial como movimentos de
 * entrada: o historico de uma peca comeca no dia em que entrou, e nao ha
 * stock nenhum que tenha aparecido sem movimento.
 */
export async function criarProduto(dados: NovoProduto, por: string): Promise<Resultado<{ id: string }>> {
  await connectDB();

  const categoria = await Category.findById(dados.categoryId).select('pecasUnicas').lean();
  if (!categoria) return recusa({ erro: 'categoria-inexistente' });

  const problemas = problemasDasMedidas(dados.variantes, categoria.pecasUnicas);
  if (problemas.length > 0) return recusa({ erro: 'medidas', problemas });

  let produto;
  try {
    produto = await Product.create({
      ...dados,
      variantes: dados.variantes.map((v) => ({ medida: v.medida || undefined, stock: 0 })),
    });
  } catch (erro) {
    if (eDuplicado(erro)) return recusa({ erro: 'slug-repetido' });
    throw erro;
  }

  for (const [i, v] of dados.variantes.entries()) {
    if (v.stock === 0) continue;
    await moverStock({
      productId: produto._id.toString(),
      varianteId: produto.variantes[i]._id.toString(),
      delta: v.stock,
      motivo: 'entrada',
      por,
      nota: 'stock inicial',
      maximo: categoria.pecasUnicas ? 1 : undefined,
    });
  }

  return { ok: true, id: produto._id.toString() };
}

/**
 * Edita o que se muda por valor. O stock nao: as medidas que ja existem so
 * mudam de nome, as novas entram com stock 0, e nenhuma desaparece.
 */
export async function editarProduto(id: string, dados: EdicaoProduto): Promise<Resultado> {
  if (!mongoose.Types.ObjectId.isValid(id)) return recusa({ erro: 'nao-existe' });
  await connectDB();

  const atual = await Product.findById(id).select('categoryId variantes').lean();
  if (!atual) return recusa({ erro: 'nao-existe' });

  const categoriaId = dados.categoryId ?? String(atual.categoryId);
  const categoria = await Category.findById(categoriaId).select('pecasUnicas').lean();
  if (!categoria) return recusa({ erro: 'categoria-inexistente' });

  const { variantes: pedidas, ...campos } = dados;
  const alteracao: Record<string, unknown> = { ...campos };

  const stockPorId = new Map(atual.variantes.map((v) => [String(v._id), v.stock]));
  let variantes = atual.variantes.map((v) => ({ _id: v._id, medida: v.medida, stock: v.stock }));

  if (pedidas) {
    const mantidas = new Set(pedidas.filter((v) => v._id).map((v) => v._id));
    if ([...stockPorId.keys()].some((vid) => !mantidas.has(vid))) {
      return recusa({ erro: 'medida-removida' });
    }
    if (pedidas.some((v) => v._id && !stockPorId.has(v._id))) {
      return recusa({ erro: 'nao-existe' });
    }
    variantes = pedidas.map((v) => ({
      _id: v._id ? new mongoose.Types.ObjectId(v._id) : new mongoose.Types.ObjectId(),
      medida: v.medida || undefined,
      stock: v._id ? stockPorId.get(v._id)! : 0,
    }));
  }

  const problemas = problemasDasMedidas(variantes, categoria.pecasUnicas);
  if (problemas.length > 0) return recusa({ erro: 'medidas', problemas });

  if (pedidas) {
    // So o nome de cada medida, e as novas: o stock das que existem fica
    // onde esta, mesmo que um movimento tenha chegado entre a leitura e aqui.
    for (const v of variantes) {
      if (stockPorId.has(String(v._id))) {
        await Product.updateOne(
          { _id: id, 'variantes._id': v._id },
          v.medida
            ? { $set: { 'variantes.$.medida': v.medida } }
            : { $unset: { 'variantes.$.medida': '' } }
        );
      } else {
        await Product.updateOne({ _id: id }, { $push: { variantes: v } });
      }
    }
  }

  try {
    if (Object.keys(alteracao).length > 0) {
      await Product.updateOne({ _id: id }, { $set: alteracao }, { runValidators: true });
    }
  } catch (erro) {
    if (eDuplicado(erro)) return recusa({ erro: 'slug-repetido' });
    throw erro;
  }
  return { ok: true };
}

/** Um movimento pelo painel: venda na loja, entrada, acerto, quebra. */
export async function movimentar(
  id: string,
  m: Movimento,
  por: string
): Promise<Resultado<{ stock: number }>> {
  if (!mongoose.Types.ObjectId.isValid(id)) return recusa({ erro: 'nao-existe' });
  await connectDB();

  const produto = await Product.findById(id).select('categoryId variantes').lean();
  const variante = produto?.variantes.find((v) => String(v._id) === m.varianteId);
  if (!produto || !variante) return recusa({ erro: 'nao-existe' });

  const categoria = await Category.findById(produto.categoryId).select('pecasUnicas').lean();
  const maximo = categoria?.pecasUnicas ? 1 : undefined;

  const ok = await moverStock({
    productId: id,
    varianteId: m.varianteId,
    delta: m.delta,
    motivo: m.motivo,
    nota: m.nota,
    por,
    maximo,
  });

  const depois = await Product.findById(id).select('variantes').lean();
  const stock = depois?.variantes.find((v) => String(v._id) === m.varianteId)?.stock ?? 0;

  if (!ok) {
    return m.delta < 0
      ? recusa({ erro: 'sem-stock', disponivel: stock })
      : recusa({ erro: 'acima-do-maximo' });
  }
  return { ok: true, stock };
}

/**
 * Tudo o que o painel lista, ativos e desativados, com o que esta reservado
 * online em cada medida — a peca continua na prateleira durante a reserva, e
 * quem esta ao balcao tem de saber que alguem a esta a pagar.
 */
export async function listarProdutos() {
  await connectDB();

  const [produtos, reservas] = await Promise.all([
    Product.find().populate('categoryId', 'name slug pecasUnicas').sort({ updatedAt: -1 }).lean(),
    Order.aggregate<{ _id: { p: mongoose.Types.ObjectId; v: mongoose.Types.ObjectId }; q: number }>([
      { $match: { status: 'PENDING' } },
      { $unwind: '$items' },
      { $group: { _id: { p: '$items.productId', v: '$items.varianteId' }, q: { $sum: '$items.quantity' } } },
    ]),
  ]);

  const reservado = new Map(reservas.map((r) => [`${r._id.p}:${r._id.v}`, r.q]));

  return produtos.map((p) => ({
    ...p,
    variantes: p.variantes.map((v) => ({
      ...v,
      reservadoOnline: reservado.get(`${p._id}:${v._id}`) ?? 0,
    })),
  }));
}

/** O historico de movimentos de um produto, do mais recente para tras. */
export async function movimentosDe(id: string, limite = 100) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  await connectDB();
  return MovimentoStock.find({ productId: id }).sort({ _id: -1 }).limit(limite).lean();
}

// ============================================
// CATEGORIAS
// ============================================

/**
 * Mudar `pecasUnicas` de uma categoria com produtos que nao cumprem a regra
 * nova e recusado, com a lista deles: passar a "pecas unicas" uma categoria
 * de aneis com medidas deixava aneis que a regra ja nao aceita.
 */
export async function editarCategoria(id: string, dados: EdicaoCategoria): Promise<Resultado> {
  if (!mongoose.Types.ObjectId.isValid(id)) return recusa({ erro: 'nao-existe' });
  await connectDB();

  const atual = await Category.findById(id).select('pecasUnicas').lean();
  if (!atual) return recusa({ erro: 'nao-existe' });

  if (dados.pecasUnicas !== undefined && dados.pecasUnicas !== atual.pecasUnicas) {
    const produtos = await Product.find({ categoryId: id }).select('name variantes').lean();
    const incompativeis = produtos
      .filter((p) => problemasDasMedidas(p.variantes, dados.pecasUnicas!).length > 0)
      .map((p) => p.name);
    if (incompativeis.length > 0) {
      return recusa({ erro: 'produtos-incompativeis', produtos: incompativeis });
    }
  }

  try {
    await Category.updateOne({ _id: id }, { $set: dados }, { runValidators: true });
  } catch (erro) {
    if (eDuplicado(erro)) return recusa({ erro: 'slug-repetido' });
    throw erro;
  }
  return { ok: true };
}

// ============================================
// ADMINISTRADORES
// ============================================

/**
 * Da ou tira o papel de administrador. **So pelo script
 * `scripts/administrador.ts`, corrido no servidor** — nao ha rota nem pagina
 * que chame isto, e `admin.test.ts` falha se alguma o importar. Uma rota que
 * promovesse contas seria a rota mais interessante do sitio para quem o
 * quisesse atacar.
 *
 * Tirar o papel termina as sessoes da conta (`versaoSessao`): o papel ja e
 * relido da base de dados a cada pedido, mas com a base de dados em baixo a
 * sessao mantem o que tinha (`lib/sessao.ts`), e um ex-administrador nao deve
 * ficar com essa porta.
 */
export async function mudarPapel(
  email: string,
  papel: 'ADMIN' | 'USER'
): Promise<'mudou' | 'ja-estava' | 'nao-existe'> {
  await connectDB();

  const conta = await User.findOne({ email: email.trim().toLowerCase() }).select('role').lean();
  if (!conta) return 'nao-existe';
  if (conta.role === papel) return 'ja-estava';

  await User.updateOne(
    { _id: conta._id },
    papel === 'USER' ? { $set: { role: papel }, $inc: { versaoSessao: 1 } } : { $set: { role: papel } }
  );
  return 'mudou';
}
