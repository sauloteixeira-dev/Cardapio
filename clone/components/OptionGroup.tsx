"use client";

import { formatCents } from "@/lib/money";
import type { OptionGroupT } from "@/lib/types";

// components.md > OptionGroup. Seleção múltipla com limite; para max_select=1 vira escolha
// única (o botão da opção já selecionada desmarca as outras do mesmo grupo).
export function OptionGroup({
  group,
  selectedIds,
  onToggle,
}: {
  group: OptionGroupT;
  selectedIds: string[];
  onToggle: (optionId: string) => void;
}) {
  const count = selectedIds.length;
  const atMax = count >= group.maxSelect;

  return (
    <fieldset className="px-4 py-3 border-b border-border">
      <legend className="sr-only">{group.name}</legend>
      <div className="flex items-baseline justify-between mb-2">
        <p className="font-bold">
          {group.name}
          {group.minSelect > 0 ? (
            <span className="ml-2 text-xs font-semibold text-accent-text align-middle">Obrigatório</span>
          ) : null}
        </p>
        <p className="text-sm text-muted" aria-live="polite">
          {count} de {group.maxSelect} selecionados
        </p>
      </div>
      <ul className="space-y-2">
        {group.options.map((opt) => {
          const selected = selectedIds.includes(opt.id);
          const disabled = opt.soldOut || (!selected && atMax);
          return (
            <li key={opt.id} className="flex items-center justify-between gap-3">
              <span className={opt.soldOut ? "text-muted line-through" : ""}>
                {opt.name}
                {opt.priceCents > 0 ? ` · ${formatCents(opt.priceCents)}` : ""}
                {opt.soldOut ? " (esgotado)" : ""}
              </span>
              <button
                type="button"
                aria-pressed={selected}
                aria-label={`${selected ? "Remover" : "Adicionar"} ${opt.name}`}
                disabled={disabled}
                onClick={() => onToggle(opt.id)}
                className={`w-8 h-8 rounded-pill flex items-center justify-center text-lg leading-none shrink-0 disabled:opacity-30 ${
                  selected ? "bg-accent text-on-accent" : "border border-border-input"
                }`}
              >
                {selected ? "–" : "+"}
              </button>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}
