import { defineConfig, devices } from "@playwright/test";

// Playwright contra o servidor local real (Supabase de verdade, dados do seed) — ver
// replica/test-plan.md. Nunca aponta para o app original.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // os testes de admin dependem de usuários/lojas que criam e apagam
  retries: 0,
  reporter: "list",
  timeout: 30_000,
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 60_000,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      testMatch: /mobile\.spec\.ts/,
      use: { ...devices["iPhone 13"] },
    },
  ],
});
