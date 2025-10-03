import CartItem from "@/components/cartItem";
import OrderSummary from "@/components/orderSummary";

export default function CarrinhoPage() {
  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-6">Carrinho</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-2">
          <CartItem name={"Pulseira"} price={50} quantity={10} />
          <CartItem name={"Colar"} price={10} quantity={20} />
        </div>
        <OrderSummary total={0} />
      </div>
    </main>
  );
}
