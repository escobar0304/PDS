'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, LayoutGrid, ListOrdered, Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight, X, AlertTriangle, RefreshCw } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';
import { apiFetch, ApiError } from '@/lib/api';

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  active: boolean;
  featured: boolean;
  images: string[];
  categoryId: Category | string;
}

const emptyForm = {
  name: '',
  slug: '',
  description: '',
  price: '',
  stock: '0',
  categoryId: '',
  featured: false,
  active: true,
  images: '',
};

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function AdminProdutos() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') router.push('/');
  }, [status, session, router]);

  useEffect(() => {
    apiFetch<Category[]>('/api/categories').then((data) => {
      setCategories(Array.isArray(data) ? data : []);
    }).catch(console.error);
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (search) params.set('search', search);
      const data = await apiFetch<{ products: Product[]; total: number; pages: number }>(
        `/api/admin/products?${params}`
      );
      setProducts(data.products || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') fetchProducts();
  }, [status, session, fetchProducts]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setFormError('');
    setShowModal(true);
  };

  const openEdit = async (product: Product) => {
    setEditingId(product._id);
    setFormError('');
    setForm({
      name: product.name,
      slug: product.slug,
      description: '',
      price: String(product.price),
      stock: String(product.stock),
      categoryId: typeof product.categoryId === 'object' ? product.categoryId._id : product.categoryId,
      featured: product.featured,
      active: product.active,
      images: product.images.join(', '),
    });

    // Fetch full product data (description not included in list)
    try {
      const data = await apiFetch<{ description?: string }>(`/api/admin/products/${product._id}`);
      setForm((prev) => ({ ...prev, description: data.description || '' }));
    } catch {}
    setShowModal(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm((prev) => {
      const updated = { ...prev, [name]: type === 'checkbox' ? checked : value };
      if (name === 'name' && !editingId) {
        updated.slug = slugify(value);
      }
      return updated;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');

    const payload = {
      name: form.name,
      slug: form.slug,
      description: form.description,
      price: parseFloat(form.price),
      stock: parseInt(form.stock),
      categoryId: form.categoryId,
      featured: form.featured,
      active: form.active,
      images: form.images ? form.images.split(',').map((s) => s.trim()).filter(Boolean) : [],
    };

    try {
      const url = editingId ? `/api/admin/products/${editingId}` : '/api/admin/products';
      const method = editingId ? 'PUT' : 'POST';
      await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setShowModal(false);
      fetchProducts();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Erro de ligação');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Eliminar "${name}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await apiFetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      fetchProducts();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Erro ao eliminar produto');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
        <Spinner size={36} className="text-[#4a1e5c]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <header className="bg-[#4a1e5c] text-white px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-serif">Pétalas de Sonho — Admin</h1>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/" className="hover:text-purple-200">Ver Loja</Link>
          <span className="text-purple-300">|</span>
          <span className="text-purple-200">{session?.user?.name}</span>
        </div>
      </header>

      <div className="flex">
        <aside className="w-56 bg-white border-r border-gray-200 min-h-[calc(100vh-60px)] p-4">
          <nav className="space-y-1">
            <Link href="/admin" className="flex items-center gap-3 px-4 py-3 text-[#6b6b6b] hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors">
              <LayoutGrid className="w-4 h-4" />Painel
            </Link>
            <Link href="/admin/produtos" className="flex items-center gap-3 px-4 py-3 bg-[#4a1e5c] text-white rounded-lg text-sm font-medium">
              <Package className="w-4 h-4" />Produtos
            </Link>
            <Link href="/admin/encomendas" className="flex items-center gap-3 px-4 py-3 text-[#6b6b6b] hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors">
              <ListOrdered className="w-4 h-4" />Encomendas
            </Link>
          </nav>
        </aside>

        <main className="flex-1 p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-serif text-[#4a1e5c]">
              Produtos <span className="text-base font-normal text-[#6b6b6b]">({total})</span>
            </h2>
            <button
              onClick={openCreate}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Novo Produto
            </button>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2 mb-6 max-w-md">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Pesquisar produtos..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a1e5c]"
            />
            <button type="submit" className="p-2 bg-[#4a1e5c] text-white rounded-lg hover:bg-purple-900 transition-colors">
              <Search className="w-4 h-4" />
            </button>
            {search && (
              <button type="button" onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }} className="p-2 border rounded-lg hover:bg-gray-50">
                <X className="w-4 h-4" />
              </button>
            )}
          </form>

          {loading ? (
            <div className="bg-white rounded-xl shadow-soft p-12 flex justify-center">
              <Spinner size={32} className="text-[#4a1e5c]" />
            </div>
          ) : fetchError ? (
            <div className="bg-white rounded-xl shadow-soft p-12 text-center">
              <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-orange-400" />
              <p className="text-sm text-[#6b6b6b] mb-4">Não foi possível carregar os produtos</p>
              <button
                onClick={fetchProducts}
                className="flex items-center gap-2 btn-primary text-sm mx-auto"
              >
                <RefreshCw className="w-4 h-4" /> Tentar novamente
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-xl shadow-soft p-12 text-center text-[#6b6b6b]">
              <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Sem produtos ainda.</p>
              <button onClick={openCreate} className="btn-primary mt-4 inline-flex items-center gap-2">
                <Plus className="w-4 h-4" />Criar primeiro produto
              </button>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-xl shadow-soft overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-3 px-4 text-left text-[#6b6b6b] font-medium">Produto</th>
                      <th className="py-3 px-4 text-left text-[#6b6b6b] font-medium">Categoria</th>
                      <th className="py-3 px-4 text-right text-[#6b6b6b] font-medium">Preço</th>
                      <th className="py-3 px-4 text-center text-[#6b6b6b] font-medium">Stock</th>
                      <th className="py-3 px-4 text-center text-[#6b6b6b] font-medium">Estado</th>
                      <th className="py-3 px-4 text-center text-[#6b6b6b] font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product._id} className="border-t border-gray-50 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-[#2c2c2c]">{product.name}</p>
                            <p className="text-xs text-[#6b6b6b]">{product.slug}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-[#6b6b6b]">
                          {typeof product.categoryId === 'object' ? product.categoryId.name : '—'}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-[#4a1e5c]">
                          {product.price.toFixed(2)}€
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`font-medium ${product.stock <= 3 ? 'text-red-600' : product.stock <= 10 ? 'text-orange-500' : 'text-green-600'}`}>
                            {product.stock}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${product.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            {product.active ? 'Ativo' : 'Inativo'}
                          </span>
                          {product.featured && (
                            <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                              Destaque
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openEdit(product)}
                              className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(product._id, product.name)}
                              className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pages > 1 && (
                <div className="flex justify-center items-center gap-3 pt-4">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-40">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-[#6b6b6b]">{page} / {pages}</span>
                  <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages} className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-40">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-serif text-[#4a1e5c]">
                {editingId ? 'Editar Produto' : 'Novo Produto'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#2c2c2c] mb-1">Nome *</label>
                  <input name="name" value={form.name} onChange={handleFormChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a1e5c]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#2c2c2c] mb-1">Slug *</label>
                  <input name="slug" value={form.slug} onChange={handleFormChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a1e5c] font-mono" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2c2c2c] mb-1">Descrição</label>
                <textarea name="description" value={form.description} onChange={handleFormChange} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a1e5c] resize-none" />
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#2c2c2c] mb-1">Preço (€) *</label>
                  <input type="number" name="price" value={form.price} onChange={handleFormChange} required step="0.01" min="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a1e5c]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#2c2c2c] mb-1">Stock</label>
                  <input type="number" name="stock" value={form.stock} onChange={handleFormChange} min="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a1e5c]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#2c2c2c] mb-1">Categoria *</label>
                  <select name="categoryId" value={form.categoryId} onChange={handleFormChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a1e5c]">
                    <option value="">Selecionar...</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2c2c2c] mb-1">
                  URLs das Imagens <span className="text-[#6b6b6b] font-normal">(separadas por vírgula)</span>
                </label>
                <input name="images" value={form.images} onChange={handleFormChange} placeholder="/images/produto.jpg, /images/produto-2.jpg" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4a1e5c]" />
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" name="active" checked={form.active} onChange={handleFormChange} className="w-4 h-4 accent-[#4a1e5c]" />
                  Produto ativo
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" name="featured" checked={form.featured} onChange={handleFormChange} className="w-4 h-4 accent-[#4a1e5c]" />
                  Produto em destaque
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-60">
                  {saving ? 'A guardar...' : editingId ? 'Guardar Alterações' : 'Criar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
