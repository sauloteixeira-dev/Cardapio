import { Suspense } from "react";
import { AdminOrdersClient } from "./admin-orders-client";

// A02 do recon.md, simplificado para a fatia vertical: sem login de lojista ainda
// (architecture.md > "Essenciais" cuida disso com Supabase Auth, antes de ir ao ar).
export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<p className="p-4 text-muted">Carregando…</p>}>
      <AdminOrdersClient />
    </Suspense>
  );
}
