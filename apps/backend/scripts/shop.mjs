// Runs a Medusa CLI command for one shop: node scripts/shop.mjs <shop> <medusa args...>
// Example: node scripts/shop.mjs sagar develop
//
// Each shop has its own database and settings in apps/backend/.env.<shop>
// (copied from .env.<shop>.template, never committed). Values in that file
// win over anything already in the shell or in apps/backend/.env.
import { spawn } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { parseEnv } from "node:util"

const [shop, ...args] = process.argv.slice(2)
if (!shop || !/^[a-z0-9-]+$/.test(shop) || args.length === 0) {
  console.error("Usage: node scripts/shop.mjs <shop> <medusa command> [args...]")
  process.exit(1)
}

const envFile = `.env.${shop}`
if (!existsSync(envFile)) {
  console.error(`Missing ${envFile}. Copy ${envFile}.template and fill it in.`)
  process.exit(1)
}

const require = createRequire(import.meta.url)
const cli = require.resolve("@medusajs/cli/cli.js")

const env = {
  ...process.env,
  // ts-node without SWC: Windows Smart App Control blocks SWC's unsigned binary.
  TS_NODE_PROJECT: process.env.TS_NODE_PROJECT ?? "tsconfig.no-swc.json",
  ...parseEnv(readFileSync(envFile, "utf8")),
  EMORA_SHOP: shop,
}

const child = spawn(process.execPath, [cli, ...args], { stdio: "inherit", env })
child.on("exit", (code) => process.exit(code ?? 1))
