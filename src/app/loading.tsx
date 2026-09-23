import { Spinner } from '@/components/ui';

/**
 * A rede de seguranca do App Router, e hoje pouco mais do que isso.
 *
 * Isto estava marcado "Provisorio. Ganha esqueletos por pagina na F10" — a
 * F10 foi entregue e os esqueletos por pagina nunca apareceram. Antes de os
 * escrever, mediu-se se chegavam a ser vistos.
 *
 * A medicao: tres navegacoes `next/link` reais a 400 kbit/s com 800 ms de
 * latencia, com um `MutationObserver` a registar cada vez que este bloco
 * entrasse no DOM. **Zero aparicoes.** Todas as paginas do sitio sao
 * `'use client'` com `fetch` dentro de um `useEffect`, e estao
 * pre-renderizadas estaticamente (`○` na saida do `build`); o Next
 * pre-carrega o payload quando a ligacao entra no ecra, por isso no momento
 * do clique nao ha nada que suspenda. A espera real e a do `fetch`, que
 * acontece **depois** de a pagina renderizar — e essa e tratada dentro de
 * cada pagina, com esqueletos e um `role="status"` que a anuncia.
 *
 * Escrever `loading.tsx` por rota seria, hoje, codigo morto.
 *
 * Nao se apaga este: volta a contar no dia em que uma pagina passar a
 * componente de servidor com dados assincronos — que e para onde a F15 tem
 * de ir, porque o JSON-LD precisa dos dados no HTML servido. Ate la fica
 * aqui um estado honesto em vez de uma promessa por cumprir.
 *
 * Sem cabecalho nem rodape de proposito, ao contrario do `not-found` e do
 * `error`: este substitui apenas o conteudo dentro do `layout`, e as paginas
 * que o rodeiam montam o seu proprio cabecalho.
 */
export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Spinner label="A carregar a página" />
    </div>
  );
}
