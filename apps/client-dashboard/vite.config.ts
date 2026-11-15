import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { fileURLToPath, URL } from "node:url"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { dedupe: ["react", "react-dom"], alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  server: {
    port: 5174,
    strictPort: true,
    proxy: Object.fromEntries(
      ["/admin", "/auth", "/static", "/uploads"].map((path) => [
        path,
        {
          target: "http://localhost:9000",
          changeOrigin: true,
        },
      ]),
    ),
  },
})
