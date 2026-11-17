"use client";

import { useEffect, useRef } from "react";
import { Button } from "./Button";
import { QuantityStepper } from "./QuantityStepper";

// components.md > AddedToCartModal. Foco vai para o modal ao abrir, Esc fecha, foco volta
// ao botão que abriu — sem isso, quem usa teclado ou leitor de tela fica preso na página.
export function AddedToCartModal({
  productName,
  quantity,
  notes,
  onQuantityChange,
  onNotesChange,
  onContinueShopping,
  onGoToCart,
}: {
  productName: string;
  quantity: number;
  notes: string;
  onQuantityChange: (q: number) => void;
  onNotesChange: (n: string) => void;
  onContinueShopping: () => void;
  onGoToCart: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onContinueShopping();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onContinueShopping]);

  return (
    <div className="fixed inset-0 z-20 flex items-end sm:items-center justify-center bg-black/60">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="added-modal-title"
        tabIndex={-1}
        className="bg-surface-raised rounded-lg shadow-pop w-full sm:max-w-sm p-6 outline-none"
      >
        <p aria-hidden="true" className="text-4xl text-center mb-2">
          🛍️
        </p>
        <h2 id="added-modal-title" className="text-lg font-bold text-center mb-4">
          {productName} adicionado ao carrinho!
        </h2>

        <div className="flex items-center justify-between py-3 border-t border-border">
          <span className="font-semibold">Quantidade</span>
          <QuantityStepper quantity={quantity} onChange={onQuantityChange} />
        </div>

        <label className="block py-3 border-t border-border">
          <span className="font-semibold block mb-1">Observações</span>
          <textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Ex.: tirar cebola, ponto da carne, etc."
            className="w-full bg-bg border border-border-input rounded-md p-2 text-sm min-h-[64px]"
          />
        </label>

        <Button className="w-full mt-2" onClick={onGoToCart}>
          Avançar para o carrinho
        </Button>
        <button
          type="button"
          onClick={onContinueShopping}
          className="w-full text-center text-accent-text font-semibold text-sm mt-3 h-10"
        >
          Continuar comprando
        </button>
      </div>
    </div>
  );
}
