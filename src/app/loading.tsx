// Provisorio. Ganha esqueletos por pagina na F10 do roteiro.
export default function Loading() {
  return (
    <div
      className="flex min-h-[60vh] items-center justify-center"
      role="status"
      aria-label="A carregar"
    >
      <div className="loading" />
    </div>
  );
}
