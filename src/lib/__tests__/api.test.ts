import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, fetchList, fetchOne } from '@/lib/api';

function responderCom(body: unknown, init: { status?: number; texto?: string } = {}) {
  const status = init.status ?? 200;
  const response = {
    ok: status >= 200 && status < 300,
    status,
    json: async () => {
      if (init.texto !== undefined) throw new SyntaxError('não é JSON');
      return body;
    },
  } as unknown as Response;
  vi.stubGlobal('fetch', vi.fn(async () => response));
}

afterEach(() => vi.unstubAllGlobals());

describe('fetchList', () => {
  it('devolve a lista quando corre bem', async () => {
    responderCom([{ _id: 'a' }]);
    await expect(fetchList('/api/x')).resolves.toEqual([{ _id: 'a' }]);
  });

  it('lanca com a mensagem do servidor quando o estado nao e ok', async () => {
    responderCom({ error: 'Erro ao buscar produtos' }, { status: 500 });
    await expect(fetchList('/api/x')).rejects.toThrow('Erro ao buscar produtos');
  });

  it('lanca ApiError com o estado', async () => {
    responderCom({ error: 'em baixo' }, { status: 503 });
    await expect(fetchList('/api/x')).rejects.toMatchObject({
      name: 'ApiError',
      status: 503,
    });
  });

  it('usa mensagem de recurso quando o corpo nao e JSON', async () => {
    responderCom(null, { status: 502, texto: '<html>bad gateway</html>' });
    await expect(fetchList('/api/x')).rejects.toThrow('O servidor respondeu 502.');
  });

  it('recusa um 200 que nao devolva uma lista', async () => {
    // Este e o caso que rebentava a loja: { error } com estado 200 ia direito
    // para o estado e o .map() seguinte falhava.
    responderCom({ error: 'isto nao e uma lista' });
    await expect(fetchList('/api/x')).rejects.toThrow(ApiError);
  });
});

describe('fetchOne', () => {
  it('devolve null num 404 em vez de lancar', async () => {
    responderCom({ error: 'Produto não encontrado' }, { status: 404 });
    await expect(fetchOne('/api/x/y')).resolves.toBeNull();
  });

  it('devolve o objeto quando corre bem', async () => {
    responderCom({ _id: 'a', name: 'Quartzo' });
    await expect(fetchOne('/api/x/y')).resolves.toEqual({ _id: 'a', name: 'Quartzo' });
  });

  it('lanca nos outros erros', async () => {
    responderCom({ error: 'rebentou' }, { status: 500 });
    await expect(fetchOne('/api/x/y')).rejects.toThrow('rebentou');
  });
});
