// LOGIN-*: a parte que o /replica-backend fechou — /admin/pedidos deixou de ser público.
// Cria um lojista de teste a cada rodada (e apaga no final) em vez de usar a conta real.
import { test, expect } from "@playwright/test";
import { createTestOwner } from "./fixtures";

const SLUG = "burgueria-exemplo";

test.describe("Login do lojista", () => {
  let owner: Awaited<ReturnType<typeof createTestOwner>>;

  test.beforeAll(async () => {
    owner = await createTestOwner(SLUG);
  });
  test.afterAll(async () => {
    await owner.cleanup();
  });

  test("LOGIN-H1 lojista entra e cai no painel", async ({ page }) => {
    await page.goto("/admin/entrar");
    await page.getByLabel(/e-mail/i).fill(owner.email);
    await page.getByLabel(/senha/i).fill(owner.password);
    await page.getByRole("button", { name: /^entrar$/i }).click();

    await expect(page).toHaveURL(/\/admin\/pedidos/);
    await expect(page.getByRole("heading", { name: /pedidos/i })).toBeVisible();
  });

  test("LOGIN-N1 senha errada não entra", async ({ page }) => {
    await page.goto("/admin/entrar");
    await page.getByLabel(/e-mail/i).fill(owner.email);
    await page.getByLabel(/senha/i).fill("senha-errada-123");
    await page.getByRole("button", { name: /^entrar$/i }).click();

    await expect(page.getByText(/e-mail ou senha incorretos/i)).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/entrar/);
  });

  test("LOGIN-E1 acessar /admin/pedidos sem sessão redireciona pro login", async ({ browser }) => {
    const context = await browser.newContext(); // navegador "limpo", sem cookie de sessão
    const page = await context.newPage();
    await page.goto("/admin/pedidos");
    await expect(page).toHaveURL(/\/admin\/entrar/);
    await context.close();
  });

  test("LOGIN-E2 /api/admin/orders sem sessão devolve 401", async ({ request }) => {
    const res = await request.get(`/api/admin/orders?slug=${SLUG}`, {
      // request novo, sem os cookies que os outros testes guardaram
      headers: { cookie: "" },
    });
    expect(res.status()).toBe(401);
  });
});
