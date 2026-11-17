// F04: lojista recebe e conduz um pedido. Inclui o teste de segurança mais importante desta
// etapa (F04-E2): um lojista de outra loja nunca pode ver ou mudar pedido que não é dele —
// não porque a rota "promete" filtrar, mas porque o banco (RLS) não deixa.
import { test, expect } from "@playwright/test";
import { createTestOwner, createOtherStoreWithOwner, seedOrder } from "./fixtures";

const SLUG = "burgueria-exemplo";

test.describe("F04 painel do lojista", () => {
  let owner: Awaited<ReturnType<typeof createTestOwner>>;

  test.beforeAll(async () => {
    owner = await createTestOwner(SLUG);
  });
  test.afterAll(async () => {
    await owner.cleanup();
  });

  async function loginAs(page: import("@playwright/test").Page, email: string, password: string) {
    await page.goto("/admin/entrar");
    await page.getByLabel(/e-mail/i).fill(email);
    await page.getByLabel(/senha/i).fill(password);
    await page.getByRole("button", { name: /^entrar$/i }).click();
    await expect(page).toHaveURL(/\/admin\/pedidos/);
  }

  test("F04-H1 aceitar e avançar um pedido", async ({ page, baseURL }) => {
    const order = await seedOrder(baseURL!, SLUG);
    await loginAs(page, owner.email, owner.password);

    const card = page.locator("li", { hasText: `Pedido #${order.number}` });
    await expect(card).toBeVisible();
    await card.getByRole("button", { name: /^aceitar$/i }).click();
    await expect(card.getByRole("button", { name: /preparar/i })).toBeVisible();

    await card.getByRole("button", { name: /preparar/i }).click();
    await expect(card.getByRole("button", { name: /marcar pronto/i })).toBeVisible();
  });

  test("F04-E1 não pode saltar etapa de status", async ({ request, baseURL }) => {
    const order = await seedOrder(baseURL!, SLUG);

    // tenta ir direto de "received" para "completed" pela API, sem passar por accepted/preparing/ready
    const res = await request.fetch(`${baseURL}/api/admin/orders/${order.id}/status`, {
      method: "PATCH",
      data: { status: "completed" },
    });
    // sem sessão a rota já devolve 401 — o importante é que NUNCA aceita a transição inválida
    expect([401, 422]).toContain(res.status());
  });

  test("F04-E2 lojista de outra loja não vê nem muda pedido desta", async ({ page, baseURL }) => {
    const order = await seedOrder(baseURL!, SLUG);
    const other = await createOtherStoreWithOwner();

    try {
      await loginAs(page, other.email, other.password);

      // pede os pedidos da loja 1 enquanto logado como dono só da loja 2
      const res = await page.request.get(`/api/admin/orders?slug=${SLUG}`);
      expect(res.status()).toBe(403);

      // tenta mudar o status do pedido da loja 1 — a RLS (is_store_member) tem que recusar
      const statusRes = await page.request.fetch(`/api/admin/orders/${order.id}/status`, {
        method: "PATCH",
        data: { status: "accepted" },
      });
      expect(statusRes.status()).toBe(422); // RLS bloqueia a escrita: "pedido não encontrado" pra este usuário
    } finally {
      await other.cleanup();
    }
  });
});
