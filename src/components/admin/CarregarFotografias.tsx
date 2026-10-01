'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Alert, AnuncioEstado, Ficheiro } from '@/components/ui';

const TIPOS = 'image/jpeg,image/png,image/webp,image/avif';

/** A mesma regra do esquema (`validacao.ts`): so estes caminhos tem miniatura. */
const VALIDO = /^\/(?:images\/[a-z0-9][a-z0-9/_-]*\.(?:webp|png|jpe?g|avif)|imagens\/[a-f0-9]{64}\.webp)$/i;

/**
 * Carrega fotografias para o produto: cada uma vai a `/api/admin/imagens`,
 * que a roda, lhe tira a localizacao e os metadados e a converte, e o
 * caminho que volta entra na lista do formulario. Mostra a lista como
 * miniaturas, por ordem: a primeira e a da montra.
 */
export default function CarregarFotografias({
  caminhos,
  onCarregada,
}: {
  caminhos: string[];
  onCarregada: (caminho: string) => void;
}) {
  const [aCarregar, setACarregar] = useState(0);
  const [erros, setErros] = useState<string[]>([]);
  const [anuncio, setAnuncio] = useState('');

  async function escolher(e: React.ChangeEvent<HTMLInputElement>) {
    const ficheiros = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (ficheiros.length === 0) return;

    setErros([]);
    setACarregar(ficheiros.length);
    const falhas: string[] = [];
    let feitas = 0;

    for (const f of ficheiros) {
      try {
        const r = await fetch('/api/admin/imagens', {
          method: 'POST',
          headers: { 'Content-Type': f.type || 'application/octet-stream' },
          body: f,
        });
        const dados = (await r.json().catch(() => ({}))) as { caminho?: string; error?: string };
        if (r.ok && dados.caminho) {
          onCarregada(dados.caminho);
          feitas += 1;
        } else {
          falhas.push(`${f.name}: ${dados.error ?? 'não foi possível carregar.'}`);
        }
      } catch {
        falhas.push(`${f.name}: sem ligação ao sítio. Tente outra vez.`);
      }
      setACarregar((n) => n - 1);
    }

    setErros(falhas);
    setAnuncio(feitas === 1 ? 'Fotografia carregada.' : `${feitas} fotografias carregadas.`);
  }

  return (
    <div className="space-y-3">
      <Ficheiro
        label="Carregar fotografias"
        hint="JPEG, PNG, WebP ou AVIF, até 10 MB cada. São rodadas e ficam sem a localização de onde foram tiradas."
        accept={TIPOS}
        multiple
        disabled={aCarregar > 0}
        onChange={escolher}
      />
      {aCarregar > 0 && <p className="text-sm text-ink-muted">A carregar… ({aCarregar})</p>}
      <AnuncioEstado>{anuncio}</AnuncioEstado>
      {erros.length > 0 && (
        <Alert tone="erro">
          <ul className="space-y-1">
            {erros.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </Alert>
      )}
      {caminhos.some((c) => VALIDO.test(c)) && (
        <ul className="flex flex-wrap gap-3" aria-label="Fotografias desta peça">
          {caminhos.filter((c) => VALIDO.test(c)).map((c, i) => (
            <li key={`${c}-${i}`} className="overflow-hidden rounded border border-line">
              <Image src={c} alt={`Fotografia ${i + 1}${i === 0 ? ', a da montra' : ''}`} width={96} height={96} className="h-24 w-24 object-cover" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
