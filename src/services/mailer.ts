import nodemailer from 'nodemailer';

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendOrderConfirmation(order: {
  _id: string;
  customerName: string;
  customerEmail: string;
  total: number;
  items: Array<{ name: string; quantity: number; price: number }>;
  deliveryType: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingPostal?: string;
}) {
  const transporter = createTransporter();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const itemsHtml = order.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px;border-bottom:1px solid #f0ebe8">${item.name}</td>
          <td style="padding:8px;border-bottom:1px solid #f0ebe8;text-align:center">${item.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #f0ebe8;text-align:right">${(item.price * item.quantity).toFixed(2)}€</td>
        </tr>`
    )
    .join('');

  const deliveryInfo =
    order.deliveryType === 'SHIPPING'
      ? `<p><strong>Morada de entrega:</strong><br>${order.shippingAddress}, ${order.shippingCity} ${order.shippingPostal}</p>`
      : `<p><strong>Entrega:</strong> Levantamento em loja</p>`;

  await transporter.sendMail({
    from: `Pétalas de Sonho <${process.env.SMTP_FROM}>`,
    to: order.customerEmail,
    subject: `Confirmação de Encomenda #${order._id.toString().slice(-6).toUpperCase()}`,
    html: `
      <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#faf8f5;padding:40px 20px">
        <div style="text-align:center;margin-bottom:32px">
          <h1 style="color:#4a1e5c;font-size:28px;margin:0">Pétalas de Sonho</h1>
          <p style="color:#6b6b6b;margin-top:8px">Obrigado pela sua encomenda</p>
        </div>
        <div style="background:white;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
          <h2 style="color:#4a1e5c;margin-top:0">Olá, ${order.customerName}</h2>
          <p>Recebemos a sua encomenda com sucesso. Assim que o pagamento for confirmado, tratamos do envio.</p>
          <p><strong>Referência:</strong> #${order._id.toString().slice(-6).toUpperCase()}</p>
          ${deliveryInfo}
          <h3 style="color:#4a1e5c;margin-top:24px">Resumo da Encomenda</h3>
          <table style="width:100%;border-collapse:collapse">
            <thead>
              <tr style="background:#f5f1e8">
                <th style="padding:10px 8px;text-align:left;color:#4a1e5c">Produto</th>
                <th style="padding:10px 8px;text-align:center;color:#4a1e5c">Qtd</th>
                <th style="padding:10px 8px;text-align:right;color:#4a1e5c">Preço</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding:12px 8px;font-weight:bold;color:#2c2c2c">Total</td>
                <td style="padding:12px 8px;font-weight:bold;color:#4a1e5c;text-align:right;font-size:18px">${order.total.toFixed(2)}€</td>
              </tr>
            </tfoot>
          </table>
          <div style="margin-top:32px;padding-top:24px;border-top:1px solid #f0ebe8;text-align:center">
            <a href="${siteUrl}/area-pessoal" style="background:#4a1e5c;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:15px">
              Ver Encomenda
            </a>
          </div>
        </div>
        <p style="text-align:center;color:#aaa;font-size:12px;margin-top:24px">
          Pétalas de Sonho &bull; Contacto: info@petalasdesonho.pt
        </p>
      </div>
    `,
  });
}

export async function sendOrderNotificationToAdmin(order: {
  _id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  total: number;
  items: Array<{ name: string; quantity: number; price: number }>;
  deliveryType: string;
}) {
  const transporter = createTransporter();

  const itemsText = order.items
    .map((item) => `  - ${item.quantity}x ${item.name}: ${(item.price * item.quantity).toFixed(2)}€`)
    .join('\n');

  await transporter.sendMail({
    from: `Pétalas de Sonho <${process.env.SMTP_FROM}>`,
    to: process.env.ADMIN_EMAIL,
    subject: `Nova Encomenda #${order._id.toString().slice(-6).toUpperCase()} — ${order.customerName}`,
    text: `Nova encomenda recebida!\n\nCliente: ${order.customerName}\nEmail: ${order.customerEmail}\nTelefone: ${order.customerPhone}\nEntrega: ${order.deliveryType === 'SHIPPING' ? 'Envio' : 'Levantamento'}\n\nProdutos:\n${itemsText}\n\nTotal: ${order.total.toFixed(2)}€`,
  });
}
