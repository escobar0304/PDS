// src/lib/api.ts
//
// Ate aqui as paginas faziam `await response.json()` sem verificar o estado da
// resposta. Num erro 500 a API devolve `{ error: "..." }`, esse objeto ia para
// o estado, e o `.map()` seguinte rebentava a pagina inteira.

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function mensagemDeErro(response: Response, fallback: string): Promise<string> {
  try {
    const corpo = await response.json();
    if (corpo && typeof corpo.error === 'string') return corpo.error;
  } catch {
    // corpo sem JSON, fica o fallback
  }
  return fallback;
}

/** Pede uma lista e garante que o que volta e mesmo uma lista. */
export async function fetchList<T>(url: string, init?: RequestInit): Promise<T[]> {
  const response = await fetch(url, init);

  if (!response.ok) {
    throw new ApiError(
      response.status,
      await mensagemDeErro(response, `O servidor respondeu ${response.status}.`)
    );
  }

  const dados = await response.json();

  if (!Array.isArray(dados)) {
    throw new ApiError(response.status, 'A resposta do servidor não tinha o formato esperado.');
  }

  return dados as T[];
}

/** Pede um recurso unico. Devolve null num 404, para o chamador distinguir. */
export async function fetchOne<T>(url: string, init?: RequestInit): Promise<T | null> {
  const response = await fetch(url, init);

  if (response.status === 404) return null;

  if (!response.ok) {
    throw new ApiError(
      response.status,
      await mensagemDeErro(response, `O servidor respondeu ${response.status}.`)
    );
  }

  return (await response.json()) as T;
}
