const { loadEnv } = require("@medusajs/framework/utils")
const { spawnSync } = require("node:child_process")

loadEnv("development", process.cwd())
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required")
const database = new URL(process.env.DATABASE_URL)
if (!["localhost", "127.0.0.1", "::1", "[::1]"].includes(database.hostname) || process.env.NODE_ENV === "production") {
  throw new Error("This preparation command only operates on a local development database")
}
process.env.EMORA_STAFF_ACCESS_ENABLED = "true"
for (const args of [
  ["db:migrate", "--skip-scripts", "--skip-search", "--skip-links"],
  ["exec", "./src/access-control/bootstrap-existing-users.ts"],
  ["exec", "./src/scripts/check-staff-access.ts"],
]) {
  const result = spawnSync(process.execPath, ["run", "--bun", "medusa", ...args], { encoding: "utf8", env: process.env })
  let output = `${result.stdout || ""}${result.stderr || ""}`
  for (const secret of [database.password, decodeURIComponent(database.password), process.env.DATABASE_URL]) {
    if (secret) output = output.replaceAll(secret, "[redacted]")
  }
  process.stdout.write(output)
  if (result.status !== 0) process.exit(result.status ?? 1)
}
