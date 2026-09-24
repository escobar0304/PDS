'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Alert, Button, Caixa, Input } from '@/components/ui';
import { pedir } from './pedir';

function paraSlug(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/**
 * Criar uma categoria, ou mudar a de uma que existe. Se as pecas sao unicas
 * e obrigatorio e sem valor por omissao: e uma decisao sobre a categoria, e o
 * servidor recusa a mudanca se houver produtos que deixavam de a cumprir.
 */
export default function FormularioCategoria({
  inicial,
}: {
  inicial?: { id: string; name: string; slug: string; pecasUnicas: boolean };
}) {
  const router = useRouter();
  const [name, setName] = useState(inicial?.name ?? '');
  const [pecasUnicas, setPecasUnicas] = useState(inicial?.pecasUnicas ?? false);
  const [erro, setErro] = useState('');
  const [estado, setEstado] = useState('');
  const [ocupado, setOcupado] = useState(false);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setEstado('');
    if (!name.trim()) {
      setErro('Falta o nome.');
      return;
    }
    setOcupado(true);
    const r = inicial
      ? await pedir(`/api/admin/categorias/${inicial.id}`, 'PATCH', { name: name.trim(), pecasUnicas })
      : await pedir('/api/admin/categorias', 'POST', {
          name: name.trim(),
          slug: paraSlug(name),
          pecasUnicas,
        });
    setOcupado(false);
    if (!r.ok) {
      setErro(r.erro);
      return;
    }
    setEstado('Guardado.');
    if (!inicial) setName('');
    router.refresh();
  };

  return (
    <form onSubmit={guardar} noValidate className="space-y-3">
      {erro && <Alert tone="erro">{erro}</Alert>}
      <Input
        label={inicial ? `Nome de ${inicial.name}` : 'Nome da categoria nova'}
        labelOculta={Boolean(inicial)}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Caixa
        label="Peças únicas"
        hint="Cada peça é aquela pedra: uma unidade, sem medidas. Desligado: modelos com medidas, como anéis."
        checked={pecasUnicas}
        onChange={setPecasUnicas}
      />
      <div className="flex items-center gap-4">
        <Button type="submit" size="sm" variant={inicial ? 'secondary' : 'primary'} loading={ocupado}>
          {inicial ? 'Guardar' : 'Criar categoria'}
        </Button>
        <p role="status" className="text-sm text-sage-600">
          {estado}
        </p>
      </div>
    </form>
  );
}
