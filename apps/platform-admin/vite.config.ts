import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { fileURLToPath, URL } from "node:url"
import { defineConfig } from "vite"

// The platform API (apps/platform-api) runs on 9100. Proxying keeps the
// session cookie same-origin in development; in production serve dist/ and
// reverse-proxy /admin and /auth to the platform API on the same host.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { dedupe: ["react", "react-dom"], alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  server: {
    port: 5175,
    strictPort: true,
    proxy: Object.fromEntries(
      ["/admin", "/auth"].map((path) => [path, { target: "http://localhost:9100", changeOrigin: true }])
    ),
  },
})
