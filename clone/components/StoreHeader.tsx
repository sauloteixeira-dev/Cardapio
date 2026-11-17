import type { Store } from "@/lib/types";

// components.md > StoreHeader, variante compacta (sem foto de capa — nenhuma imagem do
// original é usada; o logo real da loja do lojista entra aqui quando houver upload).
export function StoreHeader({ store }: { store: Store }) {
  return (
    <header className="bg-surface border-b border-border px-4 py-3 flex items-center gap-3">
      <div
        aria-hidden="true"
        className="w-10 h-10 rounded-pill bg-accent text-on-accent flex items-center justify-center font-bold text-sm shrink-0"
      >
        {store.name.slice(0, 1).toUpperCase()}
      </div>
      <div className="min-w-0">
        <h1 className="text-lg font-bold truncate">{store.name}</h1>
        <p className="text-xs text-muted flex items-center gap-1.5">
          <span
            className={`inline-block w-1.5 h-1.5 rounded-pill ${store.isOpenNow ? "bg-success" : "bg-danger"}`}
            aria-hidden="true"
          />
          {store.isOpenNow ? store.opensUntilLabel : "Fechada no momento"}
          <span aria-hidden="true">·</span>
          <span>Pedido mín. R$ {(store.minOrderCents / 100).toFixed(2).replace(".", ",")}</span>
        </p>
      </div>
    </header>
  );
}
