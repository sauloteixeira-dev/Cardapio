"use client";

// Carrinho do cliente final, guardado no aparelho (localStorage) — é uma conveniência de
// quem está vendo a tela, nunca a fonte do preço. O servidor recalcula tudo em /quote e de
// novo em /orders; se o navegador mentir, o pedido não sai com o valor errado.

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { CartItem, SelectedOption } from "./types";

interface CartContextValue {
  items: CartItem[];
  addItem: (input: {
    productId: string;
    name: string;
    unitPriceCents: number;
    quantity: number;
    notes: string;
    options: SelectedOption[];
  }) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  removeItem: (lineId: string) => void;
  clear: () => void;
  subtotalCents: number;
  itemCount: number;
}

const CartContext = createContext<CartContextValue | null>(null);

function storageKey(storeSlug: string) {
  return `cardapio-clone:cart:${storeSlug}`;
}

export function CartProvider({ storeSlug, children }: { storeSlug: string; children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(storeSlug));
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // ambiente privado, armazenamento bloqueado, etc. — carrinho só começa vazio
    } finally {
      setHydrated(true);
    }
  }, [storeSlug]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(storageKey(storeSlug), JSON.stringify(items));
    } catch {
      // se não conseguir salvar, o carrinho ainda funciona nesta sessão da aba
    }
  }, [items, storeSlug, hydrated]);

  const addItem = useCallback<CartContextValue["addItem"]>((input) => {
    setItems((prev) => [
      ...prev,
      { lineId: `line_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, ...input },
    ]);
  }, []);

  const updateQuantity = useCallback((lineId: string, quantity: number) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((i) => i.lineId !== lineId)
        : prev.map((i) => (i.lineId === lineId ? { ...i, quantity } : i)),
    );
  }, []);

  const removeItem = useCallback((lineId: string) => {
    setItems((prev) => prev.filter((i) => i.lineId !== lineId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const subtotalCents = useMemo(
    () => items.reduce((sum, i) => sum + i.unitPriceCents * i.quantity, 0),
    [items],
  );
  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);

  const value = useMemo(
    () => ({ items, addItem, updateQuantity, removeItem, clear, subtotalCents, itemCount }),
    [items, addItem, updateQuantity, removeItem, clear, subtotalCents, itemCount],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart precisa estar dentro de <CartProvider>.");
  return ctx;
}
