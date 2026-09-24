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

/**
 * O que aqui fica sao dados pessoais: enderecos IP e, nalguns limites, o
 * email da tentativa. A politica de privacidade diz quanto tempo ficam, e
 * isso tem de ser verdade.
 *
 * A limpeza so corria com mais de 5000 chaves. Num sitio com este trafego
 * nunca la chegava, e um IP podia ficar em memoria ate o servidor reiniciar —
 * nao "uma hora". Passa a correr tambem por tempo, no maximo de minuto a
 * minuto, a boleia dos pedidos que chegam.
 */
const INTERVALO_LIMPEZA_MS = 60_000;
let ultimaLimpeza = 0;

function limpar(agora: number) {
  if (baldes.size < 5000 && agora - ultimaLimpeza < INTERVALO_LIMPEZA_MS) return;
  ultimaLimpeza = agora;
  for (const [chave, r] of baldes) {
    if (r.reinicia <= agora) baldes.delete(chave);
  }
}

// E sem pedidos, tambem: um temporizador que nao segura o processo aberto.
const temporizador = setInterval(() => limpar(Date.now()), INTERVALO_LIMPEZA_MS);
temporizador.unref?.();

/** Quantas chaves estao guardadas. So para os testes. */
export function chavesGuardadas(): number {
  return baldes.size;
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
  ultimaLimpeza = 0;
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

/**
 * Limites partilhados pelas rotas que nao tem um proprio. As rotas de
 * credenciais e de correio tem limites mais apertados, escritos nelas.
 */
export const LIMITES = {
  /** Leituras publicas do catalogo: largo, para quem navega nao dar por ele. */
  leitura: { max: 300, janelaMs: 60 * 1000 },
  /** O que a propria pessoa le da sua conta. */
  conta: { max: 60, janelaMs: 60 * 1000 },
  /** Exportar a conta inteira: pesado, e ninguem precisa de o fazer a miude. */
  exportacao: { max: 5, janelaMs: 60 * 60 * 1000 },
  /** Escritas de administracao, por administrador e nao por IP. */
  administracao: { max: 120, janelaMs: 60 * 1000 },
} as const satisfies Record<string, Limite>;

/**
 * Consome um pedido do limite e devolve a resposta 429 pronta, ou `null` se
 * passou. `quem` e o IP por omissao; nas rotas autenticadas, e melhor o id da
 * sessao — varias pessoas atras do mesmo IP nao se bloqueiam umas as outras.
 *
 * `rotas-seguras.test.ts` falha se um metodo de uma rota nao
 * chamar isto (ou `consumir`).
 */
export function travar(
  pedido: Request,
  nome: string,
  limite: Limite,
  quem: string = identificar(pedido)
): Response | null {
  const r = consumir(`${nome}:${quem}`, limite);
  if (r.permitido) return null;
  return Response.json(
    { error: 'Demasiados pedidos. Tente mais tarde.' },
    { status: 429, headers: { 'Retry-After': String(r.segundosAteReiniciar) } }
  );
}
