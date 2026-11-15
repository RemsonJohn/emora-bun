import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

export default defineConfig({
  modules: [
    { resolve: "./src/modules/staff-access" },
    { resolve: "@medusajs/medusa/locking", options: { providers: [{ resolve: "@medusajs/medusa/locking-postgres", id: "locking-postgres", is_default: true }] } },
  ],
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    http: {
      storeCors: [process.env.STORE_CORS, process.env.NODE_ENV !== "production" ? "http://localhost:8001" : ""].filter(Boolean).join(","),
      adminCors: [process.env.ADMIN_CORS, process.env.NODE_ENV !== "production" ? "http://localhost:5174" : ""].filter(Boolean).join(","),
      authCors: [process.env.AUTH_CORS, process.env.NODE_ENV !== "production" ? "http://localhost:5174,http://localhost:8001" : ""].filter(Boolean).join(","),
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    }
  }
})
