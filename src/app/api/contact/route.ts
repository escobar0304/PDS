import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { consumir, identificar } from '@/lib/limites';
import { esquemaContacto, lerCorpo } from '@/lib/validacao';

/**
 * Formulario de contacto.
 *
 * Esta rota era um relay de correio. Enviava uma copia para `to: email` — o
 * endereco que quem submetia escrevia — com o nome e a mensagem interpolados
 * em HTML, sem autenticacao e sem limite de pedidos. Bastava isso para fazer
 * o servidor do negocio enviar HTML a escolha de qualquer pessoa, para o
 * endereco a escolha dela, com o dominio e a reputacao de SMTP do negocio.
 *
 * Tres mudancas:
 *
 * 1. **A copia para quem submete desaparece.** Era ela que tornava o endereco
 *    de destino escolhivel por terceiros. Limitar o conteudo nao chegava:
 *    mesmo em texto simples, continuava a ser possivel encher a caixa de
 *    correio de uma vitima a partir daqui. O unico destino e agora o endereco
 *    do negocio, fixo no ambiente. Quem submete ja sabe que submeteu: a
 *    propria pagina diz-lho.
 *
 * 2. **Texto simples em vez de HTML.** Sem HTML nao ha injeccao de HTML.
 *    Escapar tambem resolvia, mas deixava a proxima pessoa a mexer nisto
 *    livre de voltar a esquecer-se; nao haver HTML nenhum nao deixa.
 *
 * 3. **Limite de pedidos**, por IP e por endereco indicado.
 */

const LIMITE_POR_IP = { max: 5, janelaMs: 60 * 60 * 1000 };
const LIMITE_POR_EMAIL = { max: 3, janelaMs: 60 * 60 * 1000 };

/** Impede injeccao de cabecalhos: uma quebra de linha no assunto abriria um. */
function umaLinha(valor: string): string {
  return valor.replace(/[\r\n]+/g, ' ').trim();
}

export async function POST(request: Request) {
  const corpo = await lerCorpo(request, esquemaContacto);
  if (!corpo.ok) {
    return NextResponse.json({ error: corpo.erro }, { status: 400 });
  }

  const { name, email, phone, subject, message } = corpo.dados;

  const porIp = consumir(`contacto:ip:${identificar(request)}`, LIMITE_POR_IP);
  const porEmail = consumir(`contacto:email:${email}`, LIMITE_POR_EMAIL);

  if (!porIp.permitido || !porEmail.permitido) {
    const espera = Math.max(porIp.segundosAteReiniciar, porEmail.segundosAteReiniciar);
    return NextResponse.json(
      { error: 'Demasiadas mensagens. Tente mais tarde.' },
      { status: 429, headers: { 'Retry-After': String(espera) } },
    );
  }

  const destino = process.env.ADMIN_EMAIL;
  if (!destino || !process.env.SMTP_HOST) {
    console.error('Contacto: SMTP_HOST ou ADMIN_EMAIL por configurar.');
    return NextResponse.json({ error: 'Erro ao enviar mensagem' }, { status: 500 });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      // Destino fixo. Nunca o endereco que veio no pedido.
      to: destino,
      // `replyTo` e seguro porque o esquema ja garantiu que e um endereco, e
      // permite responder com um clique sem abrir o destino a escolha alheia.
      replyTo: email,
      subject: umaLinha(`Contacto do site: ${subject}`),
      text: [
        `Nome: ${name}`,
        `Email: ${email}`,
        phone ? `Telefone: ${phone}` : null,
        `Assunto: ${subject}`,
        '',
        'Mensagem:',
        message,
      ]
        .filter((l) => l !== null)
        .join('\n'),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao enviar email de contacto:', error);
    return NextResponse.json({ error: 'Erro ao enviar mensagem' }, { status: 500 });
  }
}
