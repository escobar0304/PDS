type CartItemProps = {
  name: string;
  price: number;
  quantity: number;
};

export default function CartItem({ name, price, quantity }: CartItemProps) {
  return (
    <div className="flex justify-between border p-2 rounded mb-2">
      <span>{name} (x{quantity})</span>
      <span>{price.toFixed(2)} €</span>
    </div>
  );
}
