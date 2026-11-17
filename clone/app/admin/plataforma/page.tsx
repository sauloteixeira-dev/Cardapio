import { Suspense } from "react";
import { PlatformStoresClient } from "./platform-stores-client";

// Painel do DONO DA PLATAFORMA (você) — diferente de /admin/pedidos, que é do lojista.
// Protegida em duas camadas: middleware.ts (sessão) e, dentro da rota de API, isPlatformAdmin()
// (lib/platform-data.ts) — um lojista comum logado chega até aqui mas a API devolve 403 e a
// tela mostra "acesso restrito" em vez de vazar dado de loja nenhuma.
export default function PlatformStoresPage() {
  return (
    <Suspense fallback={<p className="p-4 text-muted">Carregando…</p>}>
      <PlatformStoresClient />
    </Suspense>
  );
}
