/**
 * Limite de pedidos por janela de tempo.
 *
 * Guardado em memoria, de propósito e com uma limitacao conhecida: com mais
 * do que uma instancia do servidor, cada uma conta os seus. Para um sitio com
 * o trafego deste, e a diferenca entre nenhuma protecao e protecao suficiente
 * para tornar o abuso desinteressante. Quando houver mais do que uma
 * instancia, isto passa para Redis sem a interface mudar.
 *
 * Nao substitui o limite do fornecedor de SMTP nem o do alojamento; soma-se.
 */

type Registo = { contagem: number; reinicia: number };

const baldes = new Map<string, Registo>();

/** Limpeza preguicosa: so corre quando ha muitas chaves acumuladas. */
function limpar(agora: number) {
  if (baldes.size < 5000) return;
  for (const [chave, r] of baldes) {
    if (r.reinicia <= agora) baldes.delete(chave);
  }
}

export interface Limite {
  /** Pedidos permitidos por janela. */
  max: number;
  /** Duracao da janela, em milissegundos. */
  janelaMs: number;
}

export interface Resultado {
  permitido: boolean;
  /** Quantos ainda restam nesta janela. */
  restantes: number;
  /** Segundos ate a janela reiniciar. Util no cabecalho Retry-After. */
  segundosAteReiniciar: number;
}

export function consumir(chave: string, limite: Limite, agora = Date.now()): Resultado {
  limpar(agora);

  const atual = baldes.get(chave);

  if (!atual || atual.reinicia <= agora) {
    baldes.set(chave, { contagem: 1, reinicia: agora + limite.janelaMs });
    return {
      permitido: true,
      restantes: limite.max - 1,
      segundosAteReiniciar: Math.ceil(limite.janelaMs / 1000),
    };
  }

  atual.contagem += 1;
  const segundosAteReiniciar = Math.ceil((atual.reinicia - agora) / 1000);

  return {
    permitido: atual.contagem <= limite.max,
    restantes: Math.max(0, limite.max - atual.contagem),
    segundosAteReiniciar,
  };
}

/** Apaga tudo. Existe para os testes poderem partir de um estado limpo. */
export function reiniciarLimites() {
  baldes.clear();
}

/**
 * Identifica quem faz o pedido.
 *
 * Atras de um proxy, o IP da ligacao e o do proxy; o do cliente vem em
 * `x-forwarded-for`. O primeiro elemento e o cliente — os seguintes sao os
 * proxies pelos quais passou.
 *
 * Um cliente pode forjar este cabecalho se falar com a aplicacao diretamente.
 * Por isso isto trava abuso casual e automatizado, nao um atacante decidido:
 * para esse, o limite tem de estar na borda, antes da aplicacao.
 */
export function identificar(pedido: Request): string {
  const encaminhado = pedido.headers.get('x-forwarded-for');
  if (encaminhado) {
    const primeiro = encaminhado.split(',')[0]?.trim();
    if (primeiro) return primeiro;
  }
  return pedido.headers.get('x-real-ip') ?? 'desconhecido';
}
