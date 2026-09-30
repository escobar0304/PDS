import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * O que sai em cada email, lido na chamada ao nodemailer. Sem servidor de
 * correio: o transporte e substituido e guarda o que lhe pediram.
 */

const enviados = vi.hoisted(() => [] as { to: string; subject: string; text: string; replyTo?: string }[]);

vi.mock('nodemailer', () => ({
  default: {
    createTransport: () => ({
      sendMail: async (m: { to: string; subject: string; text: string; replyTo?: string }) => {
        enviados.push(m);
      },
    }),
  },
}));

import { enviar, enviarAvisoContaExistente, enviarReposicaoPassword, enviarVerificacao, rodapeDaLoja } from '@/services/mailer';

beforeEach(() => {
  enviados.length = 0;
  vi.stubEnv('SMTP_HOST', 'smtp.exemplo.pt');
});
afterEach(() => vi.unstubAllEnvs());

describe('o correio do sítio', () => {
  it('cada email a um cliente termina com quem envia e a morada', async () => {
    await enviarVerificacao('a@b.pt', 'Ana', 'https://x/verificar?token=t');
    await enviarReposicaoPassword('a@b.pt', 'Ana', 'https://x/nova?token=t');
    await enviarAvisoContaExistente('a@b.pt', 'Ana', 'https://x/recuperar');

    expect(enviados).toHaveLength(3);
    for (const m of enviados) {
      expect(m.text.endsWith(rodapeDaLoja())).toBe(true);
      expect(m.text).toMatch(/Pétalas de Sonho · /);
      // Com a morada por preencher, diz que falta: nunca uma inventada.
      expect(m.text).toMatch(/Morada: \(por preencher\)|, Portugal/);
    }
  });

  it('o correio que fica dentro da loja não leva o rodapé', async () => {
    await enviar({ para: 'loja@exemplo.pt', assunto: 'x', texto: 'corpo', rodape: false });
    expect(enviados[0].text).toBe('corpo');
  });

  it('uma quebra de linha no assunto não abre um cabeçalho novo', async () => {
    await enviar({ para: 'a@b.pt', assunto: 'Olá\r\nBcc: vitima@exemplo.pt', texto: 'x' });
    expect(enviados[0].subject).not.toMatch(/[\r\n]/);
  });
});
