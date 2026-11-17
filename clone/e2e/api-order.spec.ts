// Casos que são mais claros batendo direto na API (o mesmo caminho que o navegador usa) do
// que clicando na UI: duplo clique (idempotência), estado que muda no servidor (esgotado),
// e validação de entrada. Ver replica/test-plan.md.
import { test, expect, request } from "@playwright/test";
import { randomUUID } from "crypto";

const SLUG = "burgueria-exemplo";

async function getFirstProduct(baseURL: string) {
  const ctx = await request.newContext();
  const res = await ctx.get(`${baseURL}/api/s/${SLUG}/menu`);
  const data = await res.json();
  await ctx.dispose();
  return data.products[0] as { id: string };
}

test.describe("F01 validação e idempotência (API)", () => {
  test("F01-E2 duplo clique em finalizar cria só um pedido", async ({ baseURL, request: req }) => {
    const product = await getFirstProduct(baseURL!);
    const idempotencyKey = randomUUID();
    const body = {
      customer: { phone: "35999992222", name: "Duplo Clique" },
      fulfillment: "pickup",
      idempotencyKey,
      items: [{ productId: product.id, quantity: 1, notes: "", optionIds: [] }],
    };

    const [res1, res2] = await Promise.all([
      req.post(`${baseURL}/api/s/${SLUG}/orders`, { data: body }),
      req.post(`${baseURL}/api/s/${SLUG}/orders`, { data: body }),
    ]);
    const [data1, data2] = await Promise.all([res1.json(), res2.json()]);

    expect(res1.ok()).toBeTruthy();
    expect(res2.ok()).toBeTruthy();
    expect(data1.order.id).toBe(data2.order.id); // mesmo pedido, não dois
  });

  test("F01-E3 nome com acento e emoji é aceito", async ({ baseURL, request: req }) => {
    const product = await getFirstProduct(baseURL!);
    const res = await req.post(`${baseURL}/api/s/${SLUG}/orders`, {
      data: {
        customer: { phone: "35999993333", name: "José 🍔 da Silva" },
        fulfillment: "pickup",
        idempotencyKey: randomUUID(),
        items: [{ productId: product.id, quantity: 1, notes: "sem cebola, ação", optionIds: [] }],
      },
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.order.customer.name).toContain("José");
  });

  test("F01-E7 complemento esgotado é rejeitado mesmo pulando a UI", async ({ baseURL, request: req }) => {
    // "Catupiry" é esgotado no seed (supabase/seed.sql). A UI já desabilita o botão — este
    // teste confirma que o SERVIDOR também rejeita, não só a tela.
    const menuRes = await req.get(`${baseURL}/api/s/${SLUG}/menu`);
    const menu = await menuRes.json();
    const xtudo = menu.products.find((p: { name: string }) => p.name === "X-Tudo");
    const catupiry = xtudo.optionGroups[0].options.find((o: { name: string }) => o.name === "Catupiry");
    expect(catupiry.soldOut).toBe(true);

    const res = await req.post(`${baseURL}/api/s/${SLUG}/orders`, {
      data: {
        customer: { phone: "35999994444", name: "Tentando Esgotado" },
        fulfillment: "pickup",
        idempotencyKey: randomUUID(),
        items: [{ productId: xtudo.id, quantity: 1, notes: "", optionIds: [catupiry.id] }],
      },
    });
    expect(res.status()).toBe(422);
    const data = await res.json();
    expect(data.error).toMatch(/esgotado/i);
  });

  test("F01-N1 WhatsApp inválido é rejeitado pelo servidor", async ({ baseURL, request: req }) => {
    const product = await getFirstProduct(baseURL!);
    const res = await req.post(`${baseURL}/api/s/${SLUG}/orders`, {
      data: {
        customer: { phone: "123", name: "Nome Completo" },
        fulfillment: "pickup",
        idempotencyKey: randomUUID(),
        items: [{ productId: product.id, quantity: 1, notes: "", optionIds: [] }],
      },
    });
    expect(res.status()).toBe(400);
  });

  test("carrinho/items vazio é rejeitado pelo servidor (reforça F01-E1)", async ({ baseURL, request: req }) => {
    const res = await req.post(`${baseURL}/api/s/${SLUG}/orders`, {
      data: {
        customer: { phone: "35999995555", name: "Carrinho Vazio" },
        fulfillment: "pickup",
        idempotencyKey: randomUUID(),
        items: [],
      },
    });
    expect(res.status()).toBe(400);
  });
});
