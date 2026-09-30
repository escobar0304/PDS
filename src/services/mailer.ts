import nodemailer from 'nodemailer';
import { EMPRESA, moradaFormatada } from '@/lib/empresa';

/**
 * Envio de correio.
 *
 * Texto simples, sempre. Nao e economia de esforco: o formulario de contacto
 * era um relay de phishing precisamente por montar HTML com entrada externa
 * interpolada, e a regra que ficou no CLAUDE.md e que entrada externa nunca
 * chega a HTML sem escape. Nao havendo HTML, nao ha o problema — e a proxima
 * pessoa a mexer nisto nao tem como se esquecer.
 *
 * O destino nunca vem de um pedido. Quem chama passa um endereco que ja
 * validou, e nas ligacoes com token esse endereco sai da base de dados, nao
 * do corpo do pedido.
 */

export class CorreioIndisponivel extends Error {
  constructor() {
    super('Serviço de email por configurar.');
    this.name = 'CorreioIndisponivel';
  }
}

function transporte() {
  const host = process.env.SMTP_HOST;
  if (!host) throw new CorreioIndisponivel();

  return nodemailer.createTransport({
    host,
    port: Number.parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

/** Impede injeccao de cabecalhos: uma quebra de linha no assunto abriria um. */
function umaLinha(valor: string): string {
  return valor.replace(/[\r\n]+/g, ' ').trim();
}

/**
 * Quem envia, com a morada, no fim de cada email a um cliente.
 *
 * O DL 7/2004 (art. 10.º) pede a identificacao e o endereco geografico de
 * quem presta um servico em linha; o CAN-SPAM, nos EUA, pede o endereco
 * postal em correio comercial. Este sitio nao envia correio comercial — nao
 * ha newsletter nem publicidade, so emails sobre a conta ou a encomenda de
 * quem os recebe, e por isso nao ha subscricao a cancelar —, mas pôr a
 * identificacao em todos custa uma linha e nao depende de alguem se lembrar
 * dela no email seguinte. Campo por preencher diz que falta, como no resto
 * do sitio: a loja nao abre enquanto faltar (`estadoDaLoja`).
 */
export function rodapeDaLoja(): string {
  const falta = '(por preencher)';
  return [
    '',
    '--',
    `Pétalas de Sonho · ${EMPRESA.denominacao ?? falta}`,
    moradaFormatada() ?? `Morada: ${falta}`,
    EMPRESA.email ?? falta,
  ].join('\n');
}

export async function enviar({
  para,
  assunto,
  texto,
  responderPara,
  rodape = true,
}: {
  para: string;
  assunto: string;
  texto: string;
  /** Para onde vai a resposta, se nao for o remetente. Nunca vem de um pedido. */
  responderPara?: string;
  /**
   * `false` so para o correio que fica dentro da loja (o aviso de encomenda,
   * o formulario de contacto) e para a confirmacao, que ja traz "Quem vende".
   */
  rodape?: boolean;
}): Promise<void> {
  await transporte().sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: para,
    subject: umaLinha(assunto),
    text: rodape ? `${texto}\n${rodapeDaLoja()}` : texto,
    ...(responderPara ? { replyTo: responderPara } : {}),
  });
}

export async function enviarVerificacao(para: string, nome: string, ligacao: string) {
  await enviar({
    para,
    assunto: 'Confirme o seu email — Pétalas de Sonho',
    texto: [
      `Olá ${nome},`,
      '',
      'Para confirmar que este endereço é seu, abra a ligação abaixo:',
      '',
      ligacao,
      '',
      'A ligação é válida durante 24 horas e só pode ser usada uma vez.',
      '',
      'Se não foi você que criou esta conta, ignore esta mensagem. Sem a',
      'confirmação, o endereço não fica associado a ninguém.',
    ].join('\n'),
  });
}

/**
 * Alguem tentou criar conta com um email que ja a tem. O registo responde
 * igual nos dois casos, para nao dizer a terceiros quem tem conta; e aqui,
 * na caixa de correio do dono, que se diz.
 */
export async function enviarAvisoContaExistente(para: string, nome: string, ligacao: string) {
  await enviar({
    para,
    assunto: 'Já tem conta na Pétalas de Sonho',
    texto: [
      `Olá ${nome},`,
      '',
      'Alguém tentou criar uma conta com este endereço, mas ele já tem uma.',
      'Se foi você, pode entrar com a palavra-passe que já tem, ou repô-la aqui:',
      '',
      ligacao,
      '',
      'Se não foi você, ignore esta mensagem: nada mudou na sua conta.',
    ].join('\n'),
  });
}

export async function enviarReposicaoPassword(para: string, nome: string, ligacao: string) {
  await enviar({
    para,
    assunto: 'Repor a palavra-passe — Pétalas de Sonho',
    texto: [
      `Olá ${nome},`,
      '',
      'Pediu para repor a palavra-passe da sua conta. Abra a ligação abaixo:',
      '',
      ligacao,
      '',
      'A ligação é válida durante uma hora e só pode ser usada uma vez.',
      '',
      'Se não foi você que pediu, ignore esta mensagem: a palavra-passe atual',
      'continua a funcionar e não foi alterada.',
    ].join('\n'),
  });
}
