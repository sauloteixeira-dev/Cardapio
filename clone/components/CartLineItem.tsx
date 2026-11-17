import { formatCents } from "@/lib/money";
import type { CartItem } from "@/lib/types";
import { QuantityStepper } from "./QuantityStepper";

// components.md > CartLineItem.
export function CartLineItem({
  item,
  onQuantityChange,
}: {
  item: CartItem;
  onQuantityChange: (lineId: string, quantity: number) => void;
}) {
  return (
    <li className="flex items-center gap-3 py-3 border-b border-border">
      <div aria-hidden="true" className="w-14 h-14 rounded-sm bg-surface-raised shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold truncate">
          {item.quantity}× {item.name}
        </p>
        {item.options.length > 0 ? (
          <p className="text-xs text-muted truncate">{item.options.map((o) => o.optionName).join(", ")}</p>
        ) : null}
        {item.notes ? <p className="text-xs text-muted italic truncate">“{item.notes}”</p> : null}
        <p className="font-bold text-sm mt-1">{formatCents(item.unitPriceCents * item.quantity)}</p>
      </div>
      <QuantityStepper
        quantity={item.quantity}
        removeOnZero
        onChange={(q) => onQuantityChange(item.lineId, q)}
      />
    </li>
  );
}
