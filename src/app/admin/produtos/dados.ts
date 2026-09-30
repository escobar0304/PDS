import { Category } from '@/lib/models';
import connectDB from '@/lib/db';
import type { CategoriaOpcao } from '@/components/admin/FormularioProduto';
import { registarErro } from '@/lib/registo';

/** As categorias para o formulario, ou `null` sem base de dados. */
export async function categoriasParaFormulario(): Promise<CategoriaOpcao[] | null> {
  try {
    await connectDB();
    const cs = await Category.find().sort({ order: 1, name: 1 }).select('name pecasUnicas').lean();
    return cs.map((c) => ({ id: String(c._id), name: c.name, pecasUnicas: c.pecasUnicas ?? false }));
  } catch (erro) {
    registarErro('Painel: categorias indisponíveis:', erro);
    return null;
  }
}
