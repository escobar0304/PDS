type OrderSummaryProps = {
  total: number;
};

export default function OrderSummary({ total }: OrderSummaryProps) {
  return (
    <div className="border p-4 rounded">
      <h2 className="font-bold mb-2">Resumo da Encomenda</h2>
      <p>Total: {total.toFixed(2)} €</p>
      <button className="bg-pink-500 text-white px-4 py-2 rounded mt-2">
        Finalizar Compra
      </button>
    </div>
  );
}
