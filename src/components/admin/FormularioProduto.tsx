'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Alert, Button, Caixa, Input, Select, Textarea } from '@/components/ui';
import { centimosDeTexto, textoDeCentimos } from '@/lib/dinheiro';
import { pedir } from './pedir';

export interface CategoriaOpcao {
  id: string;
  name: string;
  pecasUnicas: boolean;
}

export interface ProdutoInicial {
  id: string;
  name: string;
  slug: string;
  description?: string;
  priceCents: number;
  weightGrams?: number;
  categoryId: string;
  images: string[];
  featured: boolean;
  active: boolean;
  dimensions?: string;
  variantes: { _id: string; medida?: string; stock: number }[];
}

interface MedidaEditavel {
  _id?: string;
  medida: string;
  /** So ao criar: depois disso, o stock muda por movimentos. */
  stock: string;
}

/** "Anel de Ametista" → "anel-de-ametista". So uma sugestao: o servidor valida. */
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
 * Criar e editar um produto.
 *
 * **A validacao aqui e so para ajudar quem preenche.** O servidor repete-a
 * toda (`esquemaNovoProduto`, `esquemaEdicaoProduto`, `lib/gestao.ts`), e e
 * o dele que conta: tudo o que corre no browser pode ser mudado por quem o
 * usa (ROADMAP-V2, S1).
 */
export default function FormularioProduto({
  categorias,
  inicial,
}: {
  categorias: CategoriaOpcao[];
  inicial?: ProdutoInicial;
}) {
  const router = useRouter();
  const aEditar = Boolean(inicial);

  const [name, setName] = useState(inicial?.name ?? '');
  const [slug, setSlug] = useState(inicial?.slug ?? '');
  const [slugMexido, setSlugMexido] = useState(aEditar);
  const [description, setDescription] = useState(inicial?.description ?? '');
  const [preco, setPreco] = useState(inicial ? textoDeCentimos(inicial.priceCents) : '');
  const [peso, setPeso] = useState(inicial?.weightGrams ? String(inicial.weightGrams) : '');
  const [categoryId, setCategoryId] = useState(inicial?.categoryId ?? categorias[0]?.id ?? '');
  const [imagens, setImagens] = useState((inicial?.images ?? []).join('\n'));
  const [featured, setFeatured] = useState(inicial?.featured ?? false);
  const [active, setActive] = useState(inicial?.active ?? true);
  const [dimensions, setDimensions] = useState(inicial?.dimensions ?? '');
  const [medidas, setMedidas] = useState<MedidaEditavel[]>(
    inicial
      ? inicial.variantes.map((v) => ({ _id: v._id, medida: v.medida ?? '', stock: String(v.stock) }))
      : [{ medida: '', stock: '1' }]
  );

  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroServidor, setErroServidor] = useState('');
  const [estado, setEstado] = useState('');
  const [ocupado, setOcupado] = useState(false);

  const categoria = categorias.find((c) => c.id === categoryId);
  const unica = categoria?.pecasUnicas ?? false;

  const mudarMedida = (i: number, campo: 'medida' | 'stock', valor: string) =>
    setMedidas((m) => m.map((x, j) => (j === i ? { ...x, [campo]: valor } : x)));

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroServidor('');
    setEstado('');

    const priceCents = centimosDeTexto(preco);
    const weightGrams = Number.parseInt(peso, 10);
    const e2: Record<string, string> = {};
    if (!name.trim()) e2.name = 'Falta o nome.';
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) e2.slug = 'Só minúsculas, números e hífenes.';
    if (priceCents === null) e2.preco = 'Escreva o preço como 19,90.';
    if (!Number.isInteger(weightGrams) || weightGrams < 1 || String(weightGrams) !== peso.trim()) {
      e2.peso = 'Em gramas, um número inteiro. Os portes dependem dele.';
    }
    setErros(e2);
    if (Object.keys(e2).length > 0) return;

    const comum = {
      name: name.trim(),
      slug,
      description: description.trim() || undefined,
      priceCents: priceCents!,
      weightGrams,
      categoryId,
      images: imagens.split('\n').map((l) => l.trim()).filter(Boolean),
      featured,
      active,
      dimensions: dimensions.trim() || undefined,
    };

    // Numa peca unica ha uma medida so, sem nome; o painel nao deixa
    // escrever outra coisa, e o servidor recusa-a se chegar.
    const lista = unica ? medidas.slice(0, 1).map((m) => ({ ...m, medida: '' })) : medidas;

    setOcupado(true);
    const r = aEditar
      ? await pedir(`/api/admin/produtos/${inicial!.id}`, 'PATCH', {
          ...comum,
          variantes: lista.map((m) => ({ ...(m._id ? { _id: m._id } : {}), medida: m.medida.trim() || undefined })),
        })
      : await pedir('/api/admin/produtos', 'POST', {
          ...comum,
          variantes: lista.map((m) => ({
            medida: m.medida.trim() || undefined,
            stock: Number.parseInt(m.stock || '0', 10),
          })),
        });
    setOcupado(false);

    if (!r.ok) {
      setErroServidor(r.erro);
      return;
    }
    if (aEditar) {
      setEstado('Guardado.');
      router.refresh();
    } else {
      router.push(`/admin/produtos/${r.dados.id}`);
    }
  };

  return (
    <form onSubmit={guardar} noValidate className="space-y-6">
      {erroServidor && <Alert tone="erro">{erroServidor}</Alert>}

      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="Nome"
          value={name}
          error={erros.name}
          onChange={(e) => {
            setName(e.target.value);
            if (!slugMexido) setSlug(paraSlug(e.target.value));
          }}
        />
        <Input
          label="Endereço"
          hint={`/produto/${slug || '…'}`}
          value={slug}
          error={erros.slug}
          onChange={(e) => {
            setSlugMexido(true);
            setSlug(e.target.value);
          }}
        />
        <Input
          label="Preço, com IVA"
          inputMode="decimal"
          value={preco}
          error={erros.preco}
          hint="Em euros, por exemplo 19,90"
          onChange={(e) => setPreco(e.target.value)}
        />
        <Input
          label="Peso, em gramas"
          inputMode="numeric"
          value={peso}
          error={erros.peso}
          hint="Com a embalagem: é o que os CTT pesam"
          onChange={(e) => setPeso(e.target.value)}
        />
        <Select label="Categoria" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} {c.pecasUnicas ? '(peças únicas)' : '(com medidas)'}
            </option>
          ))}
        </Select>
        <Input label="Dimensões" value={dimensions} onChange={(e) => setDimensions(e.target.value)} />
      </div>

      <Textarea label="Descrição" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />

      <Textarea
        label="Fotografias"
        rows={3}
        hint="Uma por linha, do próprio sítio: /images/nome.webp. Têm de ser desta peça."
        value={imagens}
        onChange={(e) => setImagens(e.target.value)}
      />

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-ink">
          {unica ? 'Stock desta peça' : 'Medidas'}
        </legend>
        {aEditar && (
          <p className="text-xs text-ink-muted">
            O stock muda-se por movimentos, mais abaixo. Aqui mudam-se os nomes das medidas e
            acrescentam-se novas; nenhuma se apaga, porque pode haver encomendas que apontam para ela.
          </p>
        )}
        {(unica ? medidas.slice(0, 1) : medidas).map((m, i) => (
          <div key={m._id ?? `nova-${i}`} className="grid gap-3 sm:grid-cols-2">
            {!unica && (
              <Input
                label={`Medida ${i + 1}`}
                value={m.medida}
                onChange={(e) => mudarMedida(i, 'medida', e.target.value)}
              />
            )}
            {!aEditar && (
              <Input
                label={unica ? 'Em stock (0 ou 1)' : `Stock da medida ${i + 1}`}
                inputMode="numeric"
                value={m.stock}
                onChange={(e) => mudarMedida(i, 'stock', e.target.value)}
              />
            )}
          </div>
        ))}
        {!unica && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setMedidas((m) => [...m, { medida: '', stock: '0' }])}
          >
            Acrescentar medida
          </Button>
        )}
      </fieldset>

      <div className="space-y-3">
        <Caixa label="À venda" hint="Desativado, não aparece na loja nem se pode comprar" checked={active} onChange={setActive} />
        <Caixa label="Em destaque" checked={featured} onChange={setFeatured} />
      </div>

      <div className="flex items-center gap-4">
        <Button type="submit" loading={ocupado}>
          {aEditar ? 'Guardar alterações' : 'Criar produto'}
        </Button>
        <p role="status" className="text-sm text-sage-600">
          {estado}
        </p>
      </div>
    </form>
  );
}
