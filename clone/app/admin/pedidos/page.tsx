import { Suspense } from "react";
import { AdminOrdersClient } from "./admin-orders-client";

// A02 do recon.md. Protegida pelo middleware.ts (Supabase Auth) — quem chega aqui sem
// sessão é redirecionado para /admin/entrar antes de qualquer coisa renderizar.
export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<p className="p-4 text-muted">Carregando…</p>}>
      <AdminOrdersClient />
    </Suspense>
  );
}
