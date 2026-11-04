import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173';
// tests/e2e/worker.spec.ts checks the built site as the Cloudflare Worker serves it: by default
// `npx wrangler dev --port 8788` after `npm run build`, or a deployed URL (WORKER_URL, else
// BASE_URL, as Task 20 checks the workers.dev preview).
const WORKER_URL = process.env.WORKER_URL ?? process.env.BASE_URL ?? 'http://localhost:8788';

// Both projects run the full Chromium build (`channel: 'chromium'`, new headless), not the default
// chrome-headless-shell. The shell has no GPU path: its WebGL is SwiftShader, which on the dev
// machine deadlocked after the first frame (2026-11-04: GPU process and renderer idle, the page
// unreachable, 4 runs of 4), and is minutes slower where it works. Full Chromium draws through the
// real GPU where there is one (ANGLE on D3D11 on Windows) and falls back to the same SwiftShader
// where there's none (CI's hosted runner; Playwright passes --enable-unsafe-swiftshader). It is
// the same Chrome for Testing build that `npx playwright install chromium` fetches with the shell.
const browser = { ...devices['Desktop Chrome'], channel: 'chromium' };

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  reporter: 'list',
  use: { baseURL: BASE_URL, trace: 'retain-on-failure' },
  projects: [
    { name: 'chromium', use: browser, testIgnore: /worker\.spec\.ts$/ },
    { name: 'worker', use: { ...browser, baseURL: WORKER_URL }, testMatch: /worker\.spec\.ts$/ },
  ],
  webServer: process.env.BASE_URL
    ? undefined
    : { command: 'npm run dev -- --port 5173 --strictPort', url: BASE_URL, reuseExistingServer: true },
});
