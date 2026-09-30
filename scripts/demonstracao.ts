// scripts/demonstracao.ts
//
// Pecas de exemplo para mostrar o sitio, so numa loja em ensaio:
//
//   LOJA_ENSAIO=1 npm run demo:pecas
//
// Ver `src/lib/demonstracao.ts`.
import './ambiente';
import mongoose from 'mongoose';
import { criarPecasDeExemplo } from '../src/lib/demonstracao';

criarPecasDeExemplo()
  .then((r) => {
    if (!r.ok) {
      console.error(r.porque);
      process.exitCode = 1;
      return;
    }
    console.log(`Peças de exemplo: ${r.criadas} criadas, ${r.jaExistiam} já existiam.`);
  })
  .catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
