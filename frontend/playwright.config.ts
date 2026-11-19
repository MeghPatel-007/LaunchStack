import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  // The suite shares one PostgreSQL test database and the backend enforces
  // per-IP auth rate limits, so run files one at a time.
  workers: 1,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    { name: 'chromium', dependencies: ['setup'] },
  ],
  globalTeardown: './e2e/global-teardown.ts',
  webServer: [
    {
      command: 'node --env-file=../.env.test src/server.js',
      cwd: '../backend',
      env: { PORT: '8000', NODE_ENV: 'test' },
      url: 'http://localhost:8000/auth/me',
      // Never reuse a server: it could be pointing at the development database.
      reuseExistingServer: false,
      timeout: 180_000,
    },
    {
      command: 'bun run dev',
      url: 'http://localhost:3000',
      // Next 16.4.3 stops `next dev` in agent environments to show a security
      // upgrade gate on every start; the E2E server must boot without it.
      env: { AI_AGENT: '', AGENT: '' },
      reuseExistingServer: false,
      timeout: 180_000,
    },
  ],
})
