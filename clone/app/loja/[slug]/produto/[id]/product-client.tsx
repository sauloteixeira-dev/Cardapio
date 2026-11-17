"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AddedToCartModal } from "@/components/AddedToCartModal";
import { OptionGroup } from "@/components/OptionGroup";
import { StickyCTA } from "@/components/StickyCTA";
import { useCart } from "@/lib/cart-store";
import { formatCents } from "@/lib/money";
import type { Product, SelectedOption } from "@/lib/types";

// S03 (detalhe do produto + complementos) e S04 (modal "adicionado ao carrinho") do recon.md.
export function ProductClient({ storeSlug, product }: { storeSlug: string; product: Product }) {
  const router = useRouter();
  const { addItem } = useCart();
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [added, setAdded] = useState<{ quantity: number; notes: string } | null>(null);

  function toggleOption(groupId: string, optionId: string) {
    setSelected((prev) => {
      const group = product.optionGroups.find((g) => g.id === groupId);
      const current = prev[groupId] ?? [];
      if (current.includes(optionId)) {
        return { ...prev, [groupId]: current.filter((id) => id !== optionId) };
      }
      if (group && group.maxSelect === 1) {
        return { ...prev, [groupId]: [optionId] };
      }
      return { ...prev, [groupId]: [...current, optionId] };
    });
  }

  const { unitPriceCents, selectedOptions, missingRequired } = useMemo(() => {
    let price = product.priceCents;
    const opts: SelectedOption[] = [];
    const missing: string[] = [];
    for (const group of product.optionGroups) {
      const ids = selected[group.id] ?? [];
      if (ids.length < group.minSelect) missing.push(group.name);
      for (const id of ids) {
        const opt = group.options.find((o) => o.id === id);
        if (!opt) continue;
        price += opt.priceCents;
        opts.push({ groupId: group.id, groupName: group.name, optionId: opt.id, optionName: opt.name, priceCents: opt.priceCents });
      }
    }
    return { unitPriceCents: price, selectedOptions: opts, missingRequired: missing };
  }, [product, selected]);

  function handleAdvance() {
    setAdded({ quantity: 1, notes: "" });
  }

  function confirmAdd() {
    if (!added) return;
    addItem({
      productId: product.id,
      name: product.name,
      unitPriceCents,
      quantity: added.quantity,
      notes: added.notes,
      options: selectedOptions,
    });
  }

  return (
    <div className="pb-28">
      <div className="px-4 pt-4">
        <button type="button" onClick={() => router.back()} aria-label="Voltar" className="text-xl mb-3">
          ←
        </button>
        <div aria-hidden="true" className="w-full h-40 rounded-md bg-surface-raised mb-3" />
        <h1 className="text-lg font-bold">{product.name}</h1>
        <p className="font-bold text-accent-text mb-2">{formatCents(product.priceCents)}</p>
        {product.description ? <p className="text-sm text-muted">{product.description}</p> : null}
      </div>

      {product.optionGroups.map((group) => (
        <OptionGroup
          key={group.id}
          group={group}
          selectedIds={selected[group.id] ?? []}
          onToggle={(optionId) => toggleOption(group.id, optionId)}
        />
      ))}

      <StickyCTA
        label="Avançar"
        totalLabel={formatCents(unitPriceCents)}
        disabled={product.soldOut || missingRequired.length > 0}
        reason={
          product.soldOut
            ? "Este produto está esgotado."
            : missingRequired.length > 0
              ? `Escolha uma opção em "${missingRequired[0]}".`
              : undefined
        }
        onClick={handleAdvance}
      />

      {added ? (
        <AddedToCartModal
          productName={product.name}
          quantity={added.quantity}
          notes={added.notes}
          onQuantityChange={(q) => setAdded((a) => (a ? { ...a, quantity: Math.max(1, q) } : a))}
          onNotesChange={(n) => setAdded((a) => (a ? { ...a, notes: n } : a))}
          onContinueShopping={() => {
            confirmAdd();
            setAdded(null);
            router.push(`/loja/${storeSlug}`);
          }}
          onGoToCart={() => {
            confirmAdd();
            router.push(`/loja/${storeSlug}/carrinho`);
          }}
        />
      ) : null}
    </div>
  );
}
