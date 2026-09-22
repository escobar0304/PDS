/**
 * Preferencias que a pessoa escolhe e o site guarda no proprio equipamento.
 *
 * Nada disto sai do browser nem chega ao servidor. Guardar a escolha e o que
 * torna a preferencia util: sem isso teria de ser repetida em cada visita, o
 * que na pratica e o mesmo que nao existir.
 */

export const CHAVE_MAPA = 'pds.mapa';

/** Emitido quando uma preferencia muda, para os componentes abertos reagirem. */
export const EVENTO_PREFERENCIAS = 'pds:preferencias';

/**
 * Le a preferencia do mapa.
 *
 * Devolve false em servidor e quando o armazenamento nao esta disponivel
 * (modo privado, dados bloqueados). O valor seguro por omissao e "nao
 * carregar": na duvida, nao se contacta a Google.
 */
export function mapaPermitido(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(CHAVE_MAPA) === 'sim';
  } catch {
    return false;
  }
}

/** Grava a preferencia e avisa quem estiver a ouvir. */
export function definirMapaPermitido(permitido: boolean): void {
  try {
    if (permitido) {
      window.localStorage.setItem(CHAVE_MAPA, 'sim');
    } else {
      window.localStorage.removeItem(CHAVE_MAPA);
    }
  } catch {
    // Sem armazenamento a escolha vale so para esta pagina. Nao ha nada a
    // fazer alem de nao rebentar.
  }
  window.dispatchEvent(new Event(EVENTO_PREFERENCIAS));
}
