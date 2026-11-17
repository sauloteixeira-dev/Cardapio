// components.md > QuantityStepper. Botão "-" vira lixeira ao chegar em 1, quem chama decide
// (removeOnZero) se isso remove a linha do carrinho ou só impede ir abaixo de 1.
export function QuantityStepper({
  quantity,
  onChange,
  min = 1,
  removeOnZero = false,
}: {
  quantity: number;
  onChange: (next: number) => void;
  min?: number;
  removeOnZero?: boolean;
}) {
  const atMin = quantity <= min;
  return (
    <div className="flex items-center gap-3" role="group" aria-label="Quantidade">
      <button
        type="button"
        aria-label={atMin && removeOnZero ? "Remover item" : "Diminuir quantidade"}
        onClick={() => onChange(quantity - 1)}
        className="w-8 h-8 rounded-pill border border-border-input flex items-center justify-center text-lg leading-none"
      >
        {atMin && removeOnZero ? "🗑" : "–"}
      </button>
      <span aria-live="polite" className="font-bold w-5 text-center">
        {quantity}
      </span>
      <button
        type="button"
        aria-label="Aumentar quantidade"
        onClick={() => onChange(quantity + 1)}
        className="w-8 h-8 rounded-pill border border-border-input flex items-center justify-center text-lg leading-none"
      >
        +
      </button>
    </div>
  );
}
