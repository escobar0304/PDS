import nextVitals from 'eslint-config-next/core-web-vitals';
import { defineConfig, globalIgnores } from 'eslint/config';

/**
 * ESLint 9, em flat config.
 *
 * O Next 16 retirou o `next lint` e o `eslint-config-next@16` so existe neste
 * formato. O `.eslintrc.json` que estava estendia `next/core-web-vitals` e
 * mais nada; isto e o equivalente, sem regras a mais nem a menos.
 */
export default defineConfig([
  ...nextVitals,
  globalIgnores([
    'node_modules/',
    '.next/',
    'out/',
    'build/',
    'coverage/',
    'next-env.d.ts',
    'playwright-report/',
    'test-results/',
  ]),
]);
