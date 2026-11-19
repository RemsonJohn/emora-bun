import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { fileURLToPath, URL } from "node:url"
import { defineConfig } from "vite"

// Each shop has its own backend. Run one dashboard per shop in development:
//   DASHBOARD_BACKEND_URL=http://localhost:9001 DASHBOARD_PORT=5176 node node_modules/vite/bin/vite.js
// Defaults keep the original setup (backend 9000, dashboard 5174).
const backendUrl = process.env.DASHBOARD_BACKEND_URL ?? "http://localhost:9000"
const port = Number(process.env.DASHBOARD_PORT ?? 5174)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { dedupe: ["react", "react-dom"], alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  server: {
    port,
    strictPort: true,
    proxy: Object.fromEntries(
      ["/admin", "/auth", "/static", "/uploads"].map((path) => [
        path,
        {
          target: backendUrl,
          changeOrigin: true,
        },
      ]),
    ),
  },
})
