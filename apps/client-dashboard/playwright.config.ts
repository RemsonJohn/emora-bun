import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  use: { baseURL: "http://localhost:5174", channel: "msedge", headless: true },
  webServer: {
    command: "bun run dev",
    url: "http://localhost:5174",
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
})
