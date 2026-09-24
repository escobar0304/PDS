/**
 * Pedidos do painel a `/api/admin`. Devolve a mensagem de erro do servidor,
 * que no painel diz o que falhou (ver `lib/respostas.ts`).
 */
export async function pedir(
  url: string,
  metodo: 'POST' | 'PATCH',
  corpo: unknown
): Promise<{ ok: true; dados: Record<string, unknown> } | { ok: false; erro: string }> {
  try {
    const r = await fetch(url, {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo),
    });
    const dados = await r.json().catch(() => ({}));
    if (r.ok) return { ok: true, dados };
    const detalhe = Array.isArray(dados.produtos) ? ` (${dados.produtos.join(', ')})` : '';
    return { ok: false, erro: `${dados.error ?? `O servidor respondeu ${r.status}.`}${detalhe}` };
  } catch {
    return { ok: false, erro: 'Sem ligação ao servidor.' };
  }
}
