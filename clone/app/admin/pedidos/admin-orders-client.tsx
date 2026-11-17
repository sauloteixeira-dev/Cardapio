"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AdminOrderCard } from "@/components/AdminOrderCard";
import type { OrderT, Store } from "@/lib/types";

// Painel do lojista (A02). Consulta a cada poucos segundos — components.md > AdminOrderCard
// e architecture.md explicam por que (sem Realtime nesta fatia) e o que muda quando o
// Supabase Realtime entrar: só a forma de saber que mudou, não a tela.
export function AdminOrdersClient() {
  const params = useSearchParams();
  const slug = params.get("loja") ?? "burgueria-exemplo";

  const [store, setStore] = useState<Store | null>(null);
  const [orders, setOrders] = useState<OrderT[]>([]);
  const [soundOn, setSoundOn] = useState(false);
  const knownIds = useRef(new Set<string>());
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchOrders = useCallback(async () => {
    const res = await fetch(`/api/admin/orders?slug=${slug}`, { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    const incoming = data.orders as OrderT[];

    const firstLoad = knownIds.current.size === 0;
    const freshlyNew = incoming.filter((o) => !knownIds.current.has(o.id) && o.status === "received");
    incoming.forEach((o) => knownIds.current.add(o.id));

    if (!firstLoad && freshlyNew.length > 0 && soundOn) {
      audioRef.current?.play().catch(() => {
        // alguns navegadores ainda bloqueiam mesmo após o primeiro toque; silencioso é melhor
        // do que travar a tela com um erro que o lojista não pediu
      });
    }
    if (freshlyNew.length > 0) {
      setNewIds((prev) => new Set([...prev, ...freshlyNew.map((o) => o.id)]));
    }

    setOrders(incoming);
  }, [slug, soundOn]);

  useEffect(() => {
    fetch(`/api/s/${slug}/menu`)
      .then((r) => r.json())
      .then((d) => setStore(d.store));
  }, [slug]);

  useEffect(() => {
    fetchOrders();
    const id = setInterval(fetchOrders, 4000);
    return () => clearInterval(id);
  }, [fetchOrders]);

  async function handleStatusChange(orderId: string, status: OrderT["status"]) {
    const res = await fetch(`/api/admin/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setNewIds((prev) => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
      fetchOrders();
    }
  }

  async function toggleAutoPrint(value: boolean) {
    const res = await fetch("/api/admin/store", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, autoPrint: value }),
    });
    if (res.ok) {
      const data = await res.json();
      setStore(data.store);
    }
  }

  if (!store) return <p className="p-4 text-muted">Carregando…</p>;

  const pending = orders.filter((o) => o.status === "received");
  const active = orders.filter((o) => !["received", "completed", "cancelled", "rejected"].includes(o.status));
  const done = orders.filter((o) => ["completed", "cancelled", "rejected"].includes(o.status));

  return (
    <div className="max-w-xl mx-auto p-4">
      {/* data:1x1 silencioso — numa versão real, troque por um .mp3 próprio em /public */}
      <audio ref={audioRef} src="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=" />

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold">{store.name} · Pedidos</h1>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={store.autoPrint} onChange={(e) => toggleAutoPrint(e.target.checked)} />
          Imprimir comanda (bobina 80mm)
        </label>
      </div>

      {!soundOn ? (
        <button
          type="button"
          onClick={() => {
            setSoundOn(true);
            audioRef.current?.play().catch(() => {});
          }}
          className="w-full mb-4 p-3 rounded-md bg-warning/20 text-warning font-bold text-sm"
        >
          🔔 Toque para ativar o som de novos pedidos
        </button>
      ) : null}

      <Section title="Novos" orders={pending} store={store} newIds={newIds} onStatusChange={handleStatusChange} />
      <Section title="Em andamento" orders={active} store={store} newIds={newIds} onStatusChange={handleStatusChange} />
      <Section title="Concluídos e cancelados" orders={done.slice(0, 10)} store={store} newIds={newIds} onStatusChange={handleStatusChange} collapsedByDefault />
    </div>
  );
}

function Section({
  title,
  orders,
  store,
  newIds,
  onStatusChange,
  collapsedByDefault,
}: {
  title: string;
  orders: OrderT[];
  store: Store;
  newIds: Set<string>;
  onStatusChange: (id: string, status: OrderT["status"]) => void;
  collapsedByDefault?: boolean;
}) {
  if (orders.length === 0) return null;
  return (
    <details open={!collapsedByDefault} className="mb-4">
      <summary className="font-bold mb-2 cursor-pointer">
        {title} ({orders.length})
      </summary>
      <ul>
        {orders.map((order) => (
          <AdminOrderCard
            key={order.id}
            store={store}
            order={order}
            isNew={newIds.has(order.id)}
            onStatusChange={onStatusChange}
          />
        ))}
      </ul>
    </details>
  );
}
