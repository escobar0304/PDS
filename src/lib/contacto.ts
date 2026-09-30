/**
 * Os assuntos do formulario de contacto. O formulario so oferece estes, e o
 * servidor so aceita estes (`esquemaContacto`): ate 30/09/2026 aceitava
 * qualquer texto, e o assunto ia para o cabecalho do email que a loja recebe.
 *
 * Num ficheiro so seu para o formulario, que corre no browser, nao trazer o
 * zod de `validacao.ts` atras.
 */
export const ASSUNTOS_CONTACTO = {
  informacao: 'Informação sobre produtos',
  encomenda: 'Dúvida sobre encomenda',
  personalizado: 'Pedido personalizado',
  outro: 'Outro',
} as const;

export type AssuntoContacto = keyof typeof ASSUNTOS_CONTACTO;
