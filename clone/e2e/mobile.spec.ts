// GERAL-E1: o fluxo em largura de celular (projeto "mobile" do playwright.config.ts,
// iPhone 13 — 390px). Confirma que o botão fixo do rodapé não cobre conteúdo nem corta.
import { test, expect } from "@playwright/test";

const SLUG = "burgueria-exemplo";

test("GERAL-E1 fluxo de pedido em largura de celular", async ({ page }) => {
  await page.goto(`/loja/${SLUG}`);
  await expect(page.getByRole("link", { name: /x-tudo/i })).toBeVisible();

  await page.getByRole("link", { name: /x-tudo/i }).click();
  const cta = page.getByRole("button", { name: /^avançar/i });
  await expect(cta).toBeVisible();

  // o botão fixo do rodapé não deve ficar fora da viewport nem sobrepor o conteúdo acima dele
  const box = await cta.boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  if (box && viewport) {
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);
    expect(box.x).toBeGreaterThanOrEqual(0);
  }
});
