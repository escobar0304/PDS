// scripts/seed.ts
//
// As categorias com que a loja comeca: `npm run seed`. So cria as que
// faltam; nunca apaga nem altera uma que exista. Ver `src/lib/semente.ts`.
import './ambiente';
import mongoose from 'mongoose';
import { semearCategorias } from '../src/lib/semente';

semearCategorias()
  .then(({ criadas, jaExistiam }) => {
    console.log(`Categorias: ${criadas.length} criadas, ${jaExistiam.length} já existiam (essas ficaram como estavam).`);
    for (const slug of criadas) console.log(`  + ${slug}`);
  })
  .catch((erro) => {
    console.error('O seed falhou:', erro);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
