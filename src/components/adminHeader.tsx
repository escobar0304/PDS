export default function AdminHeader() {
  return (
    <header className="bg-gray-800 text-white p-4 flex justify-between">
      <h1 className="font-bold">Admin - Pétalas de Sonho</h1>
      <nav className="space-x-4">
        <a href="/admin/produtos">Produtos</a>
        <a href="/admin/encomendas">Encomendas</a>
      </nav>
    </header>
  );
}
