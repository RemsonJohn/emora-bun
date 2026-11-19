// Runs the Medusa CLI for the platform API: node scripts/medusa.mjs <command> [args]
// ts-node runs without SWC because Windows Smart App Control blocks SWC's unsigned binary.
import { spawn } from "node:child_process"
import { createRequire } from "node:module"

const require = createRequire(import.meta.url)
const cli = require.resolve("@medusajs/cli/cli.js")
const env = { ...process.env, TS_NODE_PROJECT: process.env.TS_NODE_PROJECT ?? "tsconfig.no-swc.json" }
const child = spawn(process.execPath, [cli, ...process.argv.slice(2)], { stdio: "inherit", env })
child.on("exit", (code) => process.exit(code ?? 1))
