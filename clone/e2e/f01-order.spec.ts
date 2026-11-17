// F01: cliente faz um pedido (retirada / consumo local), pelo fluxo completo da UI.
// Ver replica/test-plan.md. Roda contra o servidor local com o banco Supabase real e os
// dados do seed (loja burgueria-exemplo).
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const SLUG = "burgueria-exemplo";

function failOnConsoleAndServerErrors(page: import("@playwright/test").Page) {
  page.on("console", (msg) => {
    if (msg.type() === "error") throw new Error(`console error: ${msg.text()}`);
  });
  page.on("response", (res) => {
    if (res.status() >= 500) throw new Error(`${res.status()} em ${res.url()}`);
  });
}

async function addXTudoToCart(page: import("@playwright/test").Page) {
  await page.goto(`/loja/${SLUG}`);
  await page.getByRole("link", { name: /x-tudo/i }).click();
  await page.getByRole("button", { name: /adicionar tomate/i }).click();
  await page.getByRole("button", { name: /^avançar/i }).click();
  await page.getByRole("button", { name: /avançar para o carrinho/i }).click();
}

test.describe("F01 cliente faz um pedido", () => {
  test.beforeEach(({ page }) => failOnConsoleAndServerErrors(page));

  test("F01-H1 happy path — retirada", async ({ page }) => {
    await addXTudoToCart(page);
    await expect(page).toHaveURL(new RegExp(`/loja/${SLUG}/carrinho`));

    await page.getByRole("button", { name: /^avançar/i }).click();
    await expect(page).toHaveURL(new RegExp(`/loja/${SLUG}/identifique-se`));

    await page.getByLabel(/seu número de whatsapp/i).fill("35999991234");
    await page.getByLabel(/seu nome e sobrenome/i).fill("Maria Teste");
    await page.getByRole("button", { name: /^avançar$/i }).click();
    await expect(page).toHaveURL(new RegExp(`/loja/${SLUG}/finalizar`));

    await page.getByRole("radio", { name: /buscar o pedido/i }).check();
    await expect(page.getByRole("button", { name: /fazer pedido/i })).toBeEnabled();
    await page.getByRole("button", { name: /fazer pedido/i }).click();

    await expect(page.getByRole("heading", { name: /pedido #\d+ feito/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /enviar pedido pelo whatsapp/i })).toBeVisible();
  });

  test("F01-H2 happy path — consumo no local", async ({ page }) => {
    await addXTudoToCart(page);
    await page.getByRole("button", { name: /^avançar/i }).click();
    await page.getByLabel(/seu número de whatsapp/i).fill("35999991234");
    await page.getByLabel(/seu nome e sobrenome/i).fill("João Teste");
    await page.getByRole("button", { name: /^avançar$/i }).click();

    await page.getByRole("radio", { name: /consumir no local/i }).check();
    await page.getByLabel(/número da mesa/i).fill("Mesa 7");
    await page.getByRole("button", { name: /fazer pedido/i }).click();

    await expect(page.getByRole("heading", { name: /pedido #\d+ feito/i })).toBeVisible();
  });

  test("F01-E1 carrinho vazio não deixa finalizar", async ({ page }) => {
    await page.goto(`/loja/${SLUG}/finalizar`);
    await expect(page.getByText(/carrinho está vazio/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /fazer pedido/i })).toHaveCount(0);
  });

  test("F01-N1 WhatsApp inválido não avança", async ({ page }) => {
    await page.goto(`/loja/${SLUG}/identifique-se`);
    await page.getByLabel(/seu número de whatsapp/i).fill("123");
    await page.getByLabel(/seu nome e sobrenome/i).fill("Nome Completo");
    await expect(page.getByRole("button", { name: /^avançar$/i })).toBeDisabled();
  });

  test("F01-N2 nome com uma letra não avança", async ({ page }) => {
    await page.goto(`/loja/${SLUG}/identifique-se`);
    await page.getByLabel(/seu número de whatsapp/i).fill("35999991234");
    await page.getByLabel(/seu nome e sobrenome/i).fill("A");
    await expect(page.getByRole("button", { name: /^avançar$/i })).toBeDisabled();
  });

  test("GERAL-E2 acessibilidade — home do cardápio", async ({ page }) => {
    await page.goto(`/loja/${SLUG}`);
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });

  test("GERAL-E2 acessibilidade — tela de identificação", async ({ page }) => {
    await page.goto(`/loja/${SLUG}/identifique-se`);
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });
});
