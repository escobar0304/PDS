// src/app/api/contact/route.ts
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, subject, message } = body;

    // Validação
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: name, email, subject, message' },
        { status: 400 }
      );
    }

    // Configurar transporter do Nodemailer
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Email para o admin
    const adminMailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: process.env.ADMIN_EMAIL || 'info@petalasdesonho.pt',
      subject: `[Contacto] ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a1e5c;">Nova Mensagem de Contacto</h2>
          <div style="background: #f5f1e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Nome:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            ${phone ? `<p><strong>Telefone:</strong> ${phone}</p>` : ''}
            <p><strong>Assunto:</strong> ${subject}</p>
          </div>
          <div style="margin: 20px 0;">
            <p><strong>Mensagem:</strong></p>
            <p style="white-space: pre-wrap;">${message}</p>
          </div>
          <hr style="border: 1px solid #e0e0e0; margin: 20px 0;">
          <p style="color: #6b6b6b; font-size: 12px;">
            Esta mensagem foi enviada através do formulário de contacto do site Pétalas de Sonho.
          </p>
        </div>
      `,
    };

    // Email de confirmação para o cliente
    const clientMailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'Recebemos a sua mensagem - Pétalas de Sonho',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #4a1e5c 0%, #6b2d7f 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">✨ Pétalas de Sonho</h1>
          </div>
          <div style="padding: 30px; background: white;">
            <h2 style="color: #4a1e5c;">Olá ${name}!</h2>
            <p style="color: #2c2c2c; line-height: 1.6;">
              Recebemos a sua mensagem e entraremos em contacto em breve.
            </p>
            <div style="background: #f5f1e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="color: #6b6b6b; margin: 0;"><strong>Resumo da sua mensagem:</strong></p>
              <p style="color: #2c2c2c; margin: 10px 0 0 0;">${message.substring(0, 150)}${message.length > 150 ? '...' : ''}</p>
            </div>
            <p style="color: #2c2c2c;">
              Obrigado por entrar em contacto connosco!
            </p>
            <p style="color: #2c2c2c;">
              Com carinho,<br>
              <strong>Equipa Pétalas de Sonho</strong>
            </p>
          </div>
          <div style="background: #faf8f5; padding: 20px; text-align: center; border-radius: 0 0 8px 8px;">
            <p style="color: #6b6b6b; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} Pétalas de Sonho. Todos os direitos reservados.
            </p>
          </div>
        </div>
      `,
    };

    // Enviar emails
    await transporter.sendMail(adminMailOptions);
    await transporter.sendMail(clientMailOptions);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return NextResponse.json(
      { error: 'Erro ao enviar mensagem' },
      { status: 500 }
    );
  }
}