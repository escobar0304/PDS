// scripts/administrador.ts
//
// As contas de gestao da loja.
//
//   npm run admin -- criar pessoa@exemplo.pt "Nome"
//   npm run admin -- promover pessoa@exemplo.pt
//   npm run admin -- retirar pessoa@exemplo.pt
//
// `criar` faz a conta sem palavra-passe; a pessoa define-a em
// /auth/recuperar-password ("Esqueci a password", na pagina de entrada).
// Ver `criarGestora` em `src/lib/gestao.ts`.
//
// Corre no servidor, com acesso a base de dados. Nao ha maneira de o fazer
// pela web, de proposito — ver `mudarPapel` em `src/lib/gestao.ts`.
import './ambiente';
import mongoose from 'mongoose';
import { criarGestora, mudarPapel } from '../src/lib/gestao';

const [acao, email, nome] = process.argv.slice(2);

const USO = 'Uso: npm run admin -- criar <email> "<nome>" | promover|retirar <email>';

async function correr(): Promise<number> {
  if (acao === 'criar') {
    if (!email || !nome?.trim()) {
      console.error(USO);
      return 2;
    }
    const r = await criarGestora(email, nome);
    console.log(
      r === 'criada'
        ? 'Conta criada, sem palavra-passe. A pessoa define-a em "Esqueci a password", na página de entrada.'
        : 'Já há conta com esse email. Nada mudou; para lhe dar acesso, use "promover".'
    );
    return r === 'criada' ? 0 : 1;
  }

  if ((acao !== 'promover' && acao !== 'retirar') || !email) {
    console.error(USO);
    return 2;
  }

  const MENSAGENS = {
    mudou: acao === 'promover' ? 'Passou a administrador.' : 'Deixou de ser administrador; as sessões terminaram.',
    'ja-estava': 'Já estava assim. Nada mudou.',
    'nao-existe': 'Não há conta com esse email. A pessoa tem de a criar primeiro, ou use "criar".',
  } as const;

  const r = await mudarPapel(email, acao === 'promover' ? 'ADMIN' : 'USER');
  console.log(MENSAGENS[r]);
  return r === 'nao-existe' ? 1 : 0;
}

correr()
  .then((codigo) => {
    process.exitCode = codigo;
  })
  .catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
