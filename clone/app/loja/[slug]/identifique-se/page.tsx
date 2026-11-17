"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { loadCustomerSession, saveCustomerSession } from "@/lib/customer-session";

// S06 do recon.md. Sem senha: só WhatsApp e nome. A validação de verdade acontece no
// servidor (POST /api/s/{slug}/customer); aqui só evita enviar um formulário vazio.
export default function IdentifyPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = loadCustomerSession(slug);
    if (saved) {
      setPhone(saved.phone);
      setName(saved.name);
    }
  }, [slug]);

  const digits = phone.replace(/\D/g, "");
  const canAdvance = digits.length >= 10 && name.trim().length >= 2;

  async function handleAdvance() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/s/${slug}/customer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: digits, name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Não foi possível continuar.");
      saveCustomerSession(slug, { phone: digits, name: name.trim() });
      router.push(`/loja/${slug}/finalizar`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível continuar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-4 pt-4 pb-28">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => router.back()} aria-label="Voltar" className="text-xl">
            ←
          </button>
          <h1 className="text-lg font-bold">Identifique-se</h1>
        </div>
        <span className="text-xs font-bold bg-success/20 text-success px-2 py-1 rounded-sm">
          Ambiente seguro
        </span>
      </div>

      <label className="block mb-4">
        <span className="block font-semibold mb-1">Seu número de WhatsApp é:</span>
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="(35) 9 9999-0000"
          className="w-full bg-surface border border-border-input rounded-md p-3 text-base"
        />
      </label>

      <label className="block mb-2">
        <span className="block font-semibold mb-1">Seu nome e sobrenome:</span>
        <input
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome e sobrenome"
          className="w-full bg-surface border border-border-input rounded-md p-3 text-base"
        />
      </label>

      {error ? (
        <p role="alert" className="text-danger text-sm font-semibold mt-2">
          {error}
        </p>
      ) : null}

      <p className="text-xs text-muted text-center mt-4">
        Para realizar seu pedido vamos precisar de suas informações, este é um ambiente
        protegido.
      </p>

      <div className="fixed bottom-0 left-0 right-0 bg-bg/95 backdrop-blur border-t border-border p-4 pb-safe">
        <Button className="w-full" disabled={!canAdvance || loading} onClick={handleAdvance}>
          {loading ? "Processando…" : "Avançar"}
        </Button>
      </div>
    </div>
  );
}
