import { spawn } from "node:child_process"
import { existsSync } from "node:fs"
import { createConnection, createServer } from "node:net"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const apps = [
  ["backend", "apps/backend", 9000, "../../node_modules/@medusajs/cli/cli.js", "develop", "--no-lint"],
  ["storefront", "apps/storefront", 8000, "../../node_modules/next/dist/bin/next", "dev", "-p", "8000"],
  ["sagar-storefront", "apps/sagar-storefront", 8001, "../../node_modules/next/dist/bin/next", "dev", "-p", "8001"],
  ["client-dashboard", "apps/client-dashboard", 5174, "node_modules/vite/bin/vite.js"],
  ["platform-api", "apps/platform-api", 9100, "scripts/medusa.mjs", "develop", "--no-lint"],
  ["platform-admin", "apps/platform-admin", 5175, "node_modules/vite/bin/vite.js"],
].filter(([, directory]) => existsSync(join(root, directory, "package.json")))

const children = []
let stopping = false
function stop(code = 0) {
  if (stopping) return
  stopping = true
  for (const child of children) {
    if (!child.pid || child.exitCode !== null) continue
    if (process.platform === "win32") {
      spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true })
    } else {
      try { process.kill(-child.pid, "SIGTERM") } catch {}
    }
  }
  process.exitCode = code
}
process.on("SIGINT", () => stop())
process.on("SIGTERM", () => stop())

async function portAvailable(port) {
  for (const host of ["127.0.0.1", "::1"]) {
    const occupied = await new Promise(resolve => {
      const socket = createConnection({ host, port })
      socket.setTimeout(500)
      socket.once("connect", () => { socket.destroy(); resolve(true) })
      socket.once("error", () => { socket.destroy(); resolve(false) })
      socket.once("timeout", () => { socket.destroy(); resolve(false) })
    })
    if (occupied) return false
  }
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.once("error", error => error.code === "EADDRINUSE" ? resolve(false) : reject(error))
    server.listen(port, () => server.close(() => resolve(true)))
  })
}

try {
  for (const [name, directory, port, entry, ...args] of apps) {
    const cwd = join(root, directory)
    if (!existsSync(resolve(cwd, entry))) throw new Error(`${name}: missing ${entry}. Run bun install --frozen-lockfile first.`)
    if (process.argv.includes("--check")) {
      console.log(`[${name}] Entry point found; configured port ${port}`)
      continue
    }
    if (!await portAvailable(port)) {
      console.log(`[${name}] Port ${port} is already occupied; leaving that process untouched. Check http://localhost:${port}`)
      continue
    }
    if (stopping) break
    const env = { ...process.env }
    if (name === "backend" && existsSync(join(cwd, "tsconfig.no-swc.json"))) env.TS_NODE_PROJECT ??= "tsconfig.no-swc.json"
    console.log(`[${name}] Starting on http://localhost:${port}`)
    const child = spawn(process.execPath, [entry, ...args], { cwd, env, stdio: "inherit", windowsHide: true, detached: process.platform !== "win32" })
    children.push(child)
    child.on("error", error => { console.error(`[${name}] ${error.message}`); stop(1) })
    child.on("exit", code => {
      if (!stopping) { console.error(`[${name}] Exited (${code}). Stopping processes launched by this command.`); stop(code || 1) }
    })
  }
  if (!process.argv.includes("--check")) {
    console.log("Start PostgreSQL separately. Backend uses .env; for isolated shops use bun run shop <shop> develop in apps/backend.")
    console.log("External Anushq/Sagar repositories and the design prototype are not included. Ctrl+C stops only processes started here.")
  }
} catch (error) {
  console.error(error.message)
  stop(1)
}
