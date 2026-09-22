import nodemailer from 'nodemailer';

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

export async function enviar({
  para,
  assunto,
  texto,
}: {
  para: string;
  assunto: string;
  texto: string;
}): Promise<void> {
  await transporte().sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: para,
    subject: umaLinha(assunto),
    text: texto,
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
