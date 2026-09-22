// scripts/check-env.ts
// Corre com `npm run check:env`. Falha com lista do que falta.
import 'dotenv/config';
import { missingEnv, OPTIONAL_ENV, REQUIRED_ENV } from '../src/lib/env';

const missing = missingEnv(REQUIRED_ENV);
const missingOptional = missingEnv(OPTIONAL_ENV);

if (missingOptional.length > 0) {
  console.warn(
    `Variáveis opcionais por definir (funcionalidades desligadas): ${missingOptional.join(', ')}`
  );
}

if (missing.length > 0) {
  console.error(`Variáveis de ambiente obrigatórias em falta:`);
  for (const name of missing) console.error(`  - ${name}`);
  console.error(`\nCopia .env.example para .env.local e preenche-as.`);
  process.exit(1);
}

console.log('Variáveis de ambiente obrigatórias: OK');
