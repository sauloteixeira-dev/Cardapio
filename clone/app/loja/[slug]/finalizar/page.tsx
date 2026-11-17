"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FulfillmentOption } from "@/components/FulfillmentOption";
import { StickyCTA } from "@/components/StickyCTA";
import { useCart } from "@/lib/cart-store";
import { loadCustomerSession, rememberOrderToken } from "@/lib/customer-session";
import { formatCents } from "@/lib/money";
import type { Fulfillment, QuoteResult } from "@/lib/types";

// S07, S08 e S09 do recon.md, simplificados para a primeira versão: sem pagamento online
// (decisão do projeto), então não há tela separada de "como pagar" — só o aviso de que é
// na entrega/balcão. Quando o Mercado Pago entrar (architecture.md), esta tela volta a
// ganhar o passo de pagamento, sem mudar o que já existe aqui.
export default function CheckoutPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { items, subtotalCents, clear } = useCart();
  const [fulfillment, setFulfillment] = useState<Fulfillment>("pickup");
  const [tableLabel, setTableLabel] = useState("");
  const [quoteResult, setQuoteResult] = useState<QuoteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const customer = loadCustomerSession(slug);
    if (!customer) router.replace(`/loja/${slug}/identifique-se`);
  }, [slug, router]);

  useEffect(() => {
    if (items.length === 0) return;
    let cancelled = false;
    fetch(`/api/s/${slug}/quote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fulfillment,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          notes: i.notes,
          optionIds: i.options.map((o) => o.optionId),
        })),
      }),
    })
      .then((r) => r.json())
      .then((data: QuoteResult) => {
        if (!cancelled) setQuoteResult(data);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, fulfillment, items]);

  async function handleSubmit() {
    const customer = loadCustomerSession(slug);
    if (!customer) return;
    setLoading(true);
    setError(null);
    try {
      const idempotencyKey =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `key_${Date.now()}_${Math.random()}`;
      const res = await fetch(`/api/s/${slug}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer,
          fulfillment,
          idempotencyKey,
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            notes: i.notes,
            optionIds: i.options.map((o) => o.optionId),
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Não foi possível finalizar o pedido.");
      rememberOrderToken(slug, data.order.publicToken);
      clear();
      router.push(`/loja/${slug}/pedido/${data.order.publicToken}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível finalizar o pedido.");
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return <p className="px-4 pt-8 text-center text-muted">Seu carrinho está vazio.</p>;
  }

  return (
    <div className="px-4 pt-4 pb-28">
      <div className="flex items-center gap-3 mb-4">
        <button type="button" onClick={() => router.back()} aria-label="Voltar" className="text-xl">
          ←
        </button>
        <h1 className="text-lg font-bold">Finalizar pedido</h1>
      </div>

      <h2 className="font-bold mb-2">Escolha onde receber</h2>
      <fieldset>
        <legend className="sr-only">Onde receber o pedido</legend>
        <FulfillmentOption
          id="f-delivery"
          icon="🏠"
          label="Entrega"
          disabled
          disabledReason="Entrega pelo site chega em breve. Por enquanto, combine a entrega pelo WhatsApp da loja."
          selected={fulfillment === "delivery"}
          onSelect={() => setFulfillment("delivery")}
        />
        <FulfillmentOption
          id="f-pickup"
          icon="🏪"
          label="Buscar o pedido"
          sublabel="Grátis"
          selected={fulfillment === "pickup"}
          onSelect={() => setFulfillment("pickup")}
        />
        <FulfillmentOption
          id="f-dinein"
          icon="🍽️"
          label="Consumir no local"
          selected={fulfillment === "dine_in"}
          onSelect={() => setFulfillment("dine_in")}
        />
      </fieldset>

      {fulfillment === "dine_in" ? (
        <label className="block my-3">
          <span className="block font-semibold mb-1">Número da mesa (opcional)</span>
          <input
            value={tableLabel}
            onChange={(e) => setTableLabel(e.target.value)}
            className="w-full bg-surface border border-border-input rounded-md p-3"
            placeholder="Ex.: Mesa 4"
          />
        </label>
      ) : null}

      <div className="mt-6 p-4 rounded-md bg-surface border border-border">
        <h2 className="font-bold mb-1">Pagamento</h2>
        <p className="text-sm text-muted">
          Pague na entrega, na maquininha do entregador{fulfillment !== "delivery" ? " ou no balcão" : ""}
          . Pagamento pelo site ainda não está disponível nesta loja.
        </p>
      </div>

      <div className="mt-6 space-y-1 text-sm">
        <Row label="Subtotal" value={formatCents(quoteResult?.subtotalCents ?? subtotalCents)} />
        {quoteResult && quoteResult.deliveryFeeCents > 0 ? (
          <Row label="Taxa de entrega" value={formatCents(quoteResult.deliveryFeeCents)} />
        ) : null}
        <Row
          label="Total"
          value={formatCents(quoteResult?.totalCents ?? subtotalCents)}
          bold
        />
        {quoteResult?.estimatedMinutesMin ? (
          <p className="text-muted">
            Previsão: entre {quoteResult.estimatedMinutesMin} e {quoteResult.estimatedMinutesMax} minutos
          </p>
        ) : null}
      </div>

      {quoteResult && !quoteResult.ok && quoteResult.errors.length > 0 ? (
        <ul role="alert" className="mt-3 text-danger text-sm font-semibold space-y-1">
          {quoteResult.errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      ) : null}
      {error ? (
        <p role="alert" className="mt-3 text-danger text-sm font-semibold">
          {error}
        </p>
      ) : null}

      <StickyCTA
        label="Fazer pedido"
        disabled={!quoteResult?.ok || loading}
        loading={loading}
        onClick={handleSubmit}
      />
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-bold text-base pt-2 border-t border-border" : "text-muted"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
