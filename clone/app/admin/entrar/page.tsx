import { Suspense } from "react";
import { LoginForm } from "./login-form";

// Tela de login do lojista (nova, desta etapa). Sem cadastro aqui de propósito: contas de
// lojista são criadas pelo painel do Supabase por enquanto (replica/backend.md > "Primeiro
// acesso do lojista") — um formulário de cadastro público fica para quando o SaaS tiver
// um fluxo de assinatura de verdade.
export default function AdminLoginPage() {
  return (
    <div className="max-w-sm mx-auto p-6 mt-16">
      <h1 className="text-lg font-bold mb-1">Entrar no painel</h1>
      <p className="text-sm text-muted mb-6">Acesso restrito a quem administra a loja.</p>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
