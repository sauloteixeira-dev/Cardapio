"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { PlatformStoreRow } from "@/lib/platform-data";

export function PlatformStoresClient() {
  const [stores, setStores] = useState<PlatformStoreRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/platform/stores", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Erro ao carregar as lojas.");
          return;
        }
        setStores(data.stores);
      })
      .catch(() => setError("Erro ao carregar as lojas."));
  }, []);

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <p className="text-danger">{error}</p>
      </div>
    );
  }
  if (!stores) return <p className="p-4 text-muted">Carregando…</p>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold">Lojas na plataforma ({stores.length})</h1>
        <Link href="/admin/plataforma/nova" className="text-sm font-bold underline">
          + Nova loja
        </Link>
      </div>

      {stores.length === 0 ? (
        <p className="text-muted text-sm">Nenhuma loja cadastrada ainda.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {stores.map((s) => (
            <li key={s.id} className="p-3 rounded-md border border-input">
              <div className="flex items-center justify-between">
                <span className="font-bold">{s.name}</span>
                <span className={s.isPaused ? "text-danger text-xs" : "text-success text-xs"}>
                  {s.isPaused ? "Pausada" : "Ativa"}
                </span>
              </div>
              <p className="text-sm text-muted">/loja/{s.slug}</p>
              <p className="text-sm text-muted">Dono: {s.ownerEmail ?? "—"}</p>
              <p className="text-sm text-muted">
                Plano: {s.plan ?? "—"} {s.subscriptionStatus ? `(${s.subscriptionStatus})` : ""}
              </p>
              <div className="flex gap-3 mt-2 text-sm">
                <Link href={`/loja/${s.slug}`} className="underline">
                  Ver cardápio
                </Link>
                <Link href={`/admin/pedidos?loja=${s.slug}`} className="underline">
                  Ver pedidos
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
