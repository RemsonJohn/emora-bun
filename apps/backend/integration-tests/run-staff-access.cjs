const { loadEnv } = require("@medusajs/framework/utils")
const { spawnSync } = require("node:child_process")

// Use the development server's connection for the runner's isolated temporary database.
loadEnv("development", process.cwd())
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required")
const database = new URL(process.env.DATABASE_URL)
process.env.DB_USERNAME = decodeURIComponent(database.username)
process.env.DB_PASSWORD = decodeURIComponent(database.password)
process.env.DB_HOST = database.hostname
process.env.DB_PORT = database.port || "5432"
process.env.TEST_TYPE = "integration:http"
process.env.NODE_OPTIONS = "--experimental-vm-modules"
process.env.EMORA_STAFF_ACCESS_ENABLED = "true"
process.env.JWT_SECRET = "integration-test-staff-access-secret"
process.env.COOKIE_SECRET = "integration-test-cookie-secret"

const result = spawnSync(process.execPath, [require.resolve("jest/bin/jest"), "--runInBand", "--forceExit", "integration-tests/http/staff-access.spec.ts"], { encoding: "utf8", env: process.env })
let output = `${result.stdout || ""}${result.stderr || ""}`
for (const secret of [database.password, decodeURIComponent(database.password), process.env.DATABASE_URL]) {
  if (secret) output = output.replaceAll(secret, "[redacted]")
}
output = output.split(/\r?\n/).filter(line => !line.startsWith('{"level":"info"')).join("\n")
process.stdout.write(output)
process.exitCode = result.status ?? 1
