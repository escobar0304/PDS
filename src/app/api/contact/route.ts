import { NextResponse } from 'next/server';
import { consumir, identificar } from '@/lib/limites';
import { ASSUNTOS_CONTACTO } from '@/lib/contacto';
import { esquemaContacto, lerCorpo } from '@/lib/validacao';
import { CorreioIndisponivel, enviar } from '@/services/mailer';
import { registarErro } from '@/lib/registo';

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
 *
 * E desde 30/09/2026 passa pelo `enviar` de `services/mailer.ts`, como todo o
 * outro correio: um so sitio a criar a ligacao SMTP e a limpar o assunto.
 * Antes tinha a sua copia de cada uma das duas coisas.
 */

const LIMITE_POR_IP = { max: 5, janelaMs: 60 * 60 * 1000 };
const LIMITE_POR_EMAIL = { max: 3, janelaMs: 60 * 60 * 1000 };

export async function POST(request: Request) {
  const corpo = await lerCorpo(request, esquemaContacto);
  if (!corpo.ok) {
    return NextResponse.json({ error: corpo.erro }, { status: 400 });
  }

  const { name, email, phone, subject, message, sitio } = corpo.dados;

  const porIp = consumir(`contacto:ip:${identificar(request)}`, LIMITE_POR_IP);
  const porEmail = consumir(`contacto:email:${email}`, LIMITE_POR_EMAIL);

  if (!porIp.permitido || !porEmail.permitido) {
    const espera = Math.max(porIp.segundosAteReiniciar, porEmail.segundosAteReiniciar);
    return NextResponse.json(
      { error: 'Demasiadas mensagens. Tente mais tarde.' },
      { status: 429, headers: { 'Retry-After': String(espera) } },
    );
  }

  // A armadilha: o campo `sitio` nao se ve nem se alcanca com o teclado, e so
  // um programa o preenche. Responde-se como se tivesse corrido bem, para o
  // programa nao aprender a evita-la; a mensagem nao sai. Depois do limite, e
  // nao antes: um programa que a pise continua a gastar a quota.
  if (sitio) return NextResponse.json({ success: true });

  const destino = process.env.ADMIN_EMAIL;
  if (!destino) {
    registarErro('Contacto: ADMIN_EMAIL por configurar.');
    return NextResponse.json({ error: 'Erro ao enviar mensagem' }, { status: 500 });
  }

  const assunto = ASSUNTOS_CONTACTO[subject];

  try {
    await enviar({
      // Destino fixo. Nunca o endereco que veio no pedido.
      para: destino,
      // `responderPara` e seguro porque o esquema ja garantiu que e um
      // endereco, e permite responder com um clique sem abrir o destino a
      // escolha alheia.
      responderPara: email,
      assunto: `Contacto do site: ${assunto}`,
      texto: [
        `Nome: ${name}`,
        `Email: ${email}`,
        phone ? `Telefone: ${phone}` : null,
        `Assunto: ${assunto}`,
        '',
        'Mensagem:',
        message,
      ]
        .filter((l) => l !== null)
        .join('\n'),
      // Fica dentro da loja: a identificacao dela nao serve a quem a le.
      rodape: false,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof CorreioIndisponivel) {
      registarErro('Contacto: SMTP_HOST por configurar.');
    } else {
      registarErro('Erro ao enviar email de contacto:', error);
    }
    return NextResponse.json({ error: 'Erro ao enviar mensagem' }, { status: 500 });
  }
}
