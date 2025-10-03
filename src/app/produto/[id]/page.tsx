export default function ProdutoDetalhePage({ params }: { params: { id: string } }) {
  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-4">Produto {params.id}</h1>
      <p className="mb-4">Descrição do produto aqui...</p>
      <button className="bg-green-600 text-white px-4 py-2 rounded">
        Adicionar ao Carrinho
      </button>
    </main>
  );
}
