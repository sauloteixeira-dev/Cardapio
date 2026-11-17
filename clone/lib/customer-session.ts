"use client";

// Sessão do cliente final (telefone + nome), guardada no aparelho. Não é autenticação de
// verdade: qualquer pessoa com este aparelho vê como este cliente. Serve só para não pedir
// WhatsApp e nome de novo a cada pedido. Ver architecture.md, rota POST /api/s/{slug}/customer.

export interface CustomerSession {
  phone: string;
  name: string;
}

function key(storeSlug: string) {
  return `cardapio-clone:customer:${storeSlug}`;
}

export function loadCustomerSession(storeSlug: string): CustomerSession | null {
  try {
    const raw = localStorage.getItem(key(storeSlug));
    return raw ? (JSON.parse(raw) as CustomerSession) : null;
  } catch {
    return null;
  }
}

export function saveCustomerSession(storeSlug: string, session: CustomerSession) {
  try {
    localStorage.setItem(key(storeSlug), JSON.stringify(session));
  } catch {
    // segue sem salvar; a tela de identificação pergunta nas próximas vezes
  }
}

// Tokens de pedidos feitos neste aparelho — é assim que a aba "Pedidos" (F03) vai listar
// o histórico sem exigir senha nem expor pedidos de outra pessoa (ver architecture.md).
export function rememberOrderToken(storeSlug: string, token: string) {
  try {
    const k = `cardapio-clone:orders:${storeSlug}`;
    const list: string[] = JSON.parse(localStorage.getItem(k) ?? "[]");
    localStorage.setItem(k, JSON.stringify([token, ...list.filter((t) => t !== token)].slice(0, 20)));
  } catch {
    // histórico local é conveniência, não dado oficial
  }
}
