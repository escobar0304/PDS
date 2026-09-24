// scripts/administrador.ts
//
// Da ou tira o papel de administrador a uma conta que ja existe.
//
//   npm run admin -- promover pessoa@exemplo.pt
//   npm run admin -- retirar pessoa@exemplo.pt
//
// Corre no servidor, com acesso a base de dados. Nao ha maneira de o fazer
// pela web, de proposito — ver `mudarPapel` em `src/lib/gestao.ts`.
import 'dotenv/config';
import mongoose from 'mongoose';
import { mudarPapel } from '../src/lib/gestao';

const [acao, email] = process.argv.slice(2);

if ((acao !== 'promover' && acao !== 'retirar') || !email) {
  console.error('Uso: npm run admin -- promover|retirar <email>');
  process.exit(2);
}

const MENSAGENS = {
  mudou: acao === 'promover' ? 'Passou a administrador.' : 'Deixou de ser administrador; as sessões terminaram.',
  'ja-estava': 'Já estava assim. Nada mudou.',
  'nao-existe': 'Não há conta com esse email. A pessoa tem de a criar primeiro.',
} as const;

mudarPapel(email, acao === 'promover' ? 'ADMIN' : 'USER')
  .then((r) => {
    console.log(MENSAGENS[r]);
    process.exitCode = r === 'nao-existe' ? 1 : 0;
  })
  .catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
