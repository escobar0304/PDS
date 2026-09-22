import { describe, expect, it } from 'vitest';
import {
  expiraEm,
  gerarToken,
  ligacaoToken,
  resumir,
  resumosIguais,
  VALIDADE_MS,
} from '../tokens';

describe('tokens de uso único', () => {
  it('não são adivinháveis nem repetíveis', () => {
    const muitos = new Set(Array.from({ length: 500 }, gerarToken));

    expect(muitos.size, 'houve colisão em 500 tokens').toBe(500);
    // 32 bytes em base64url dão 43 caracteres.
    expect([...muitos][0]).toHaveLength(43);
  });

  it('só têm caracteres seguros em URL', () => {
    for (let i = 0; i < 50; i += 1) {
      expect(gerarToken()).toMatch(/^[A-Za-z0-9_-]+$/);
    }
  });

  it('o resumo não deixa voltar ao token', () => {
    const token = gerarToken();
    const r = resumir(token);

    expect(r).toHaveLength(64);
    expect(r).not.toContain(token);
    // É o que fica na base de dados: quem a leia fica com isto e mais nada.
    expect(resumir(token)).toBe(r);
    expect(resumir(gerarToken())).not.toBe(r);
  });

  it('a comparação de resumos não aceita quase-iguais', () => {
    const a = resumir('x');
    expect(resumosIguais(a, a)).toBe(true);
    expect(resumosIguais(a, resumir('y'))).toBe(false);
    // Comprimentos diferentes não podem rebentar a comparação.
    expect(resumosIguais(a, 'curto')).toBe(false);
  });

  it('repor a palavra-passe expira muito antes de verificar o email', () => {
    // Verificar o email a expirar é uma inconveniência; repor a palavra-passe
    // a ser intercetado é uma tomada de conta.
    expect(VALIDADE_MS['repor-password']).toBeLessThan(VALIDADE_MS['verificar-email']);
    expect(VALIDADE_MS['repor-password']).toBe(60 * 60 * 1000);
    expect(VALIDADE_MS['verificar-email']).toBe(24 * 60 * 60 * 1000);
  });

  it('a expiração conta a partir de agora', () => {
    const t0 = 1_700_000_000_000;
    expect(expiraEm('repor-password', t0).getTime()).toBe(t0 + 60 * 60 * 1000);
  });

  it('a ligação aponta à página certa e escapa o token', () => {
    const lig = ligacaoToken('repor-password', 'a+b/c=', 'https://exemplo.pt/');

    expect(lig).toBe('https://exemplo.pt/auth/nova-password?token=a%2Bb%2Fc%3D');
    expect(ligacaoToken('verificar-email', 'x', 'https://exemplo.pt')).toContain(
      '/auth/verificar?token=x',
    );
  });
});
