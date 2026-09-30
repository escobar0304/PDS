// scripts/ambiente.ts
//
// Carrega o ambiente como o Next.js o carrega: `.env.local` primeiro, e o
// `.env` para o que la faltar. Importar isto antes de tudo o resto.
//
// Havia dois costumes: o `seed` lia so o `.env.local`, e o `admin` e o
// `check:env` so o `.env`. Quem seguia as instrucoes ficava com um deles a
// falhar por falta do `MONGODB_URI`.
import { config } from 'dotenv';

config({ path: ['.env.local', '.env'], quiet: true });
