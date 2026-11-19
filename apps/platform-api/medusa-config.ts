import { loadEnv, defineConfig } from "@medusajs/framework/utils"

loadEnv(process.env.NODE_ENV || "development", process.cwd())

/**
 * Emora platform API. It reuses Medusa for staff accounts (email + password,
 * TOTP two-factor with recovery codes, invites), modules and workflows.
 * Medusa's commerce modules load by default but are unreachable: the route
 * guard in src/api/middlewares.ts allows only the platform routes.
 */
export default defineConfig({
  admin: { disable: true },
  modules: [{ resolve: "./src/modules/registry" }],
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    http: {
      storeCors: "",
      adminCors: process.env.ADMIN_CORS ?? "",
      authCors: process.env.AUTH_CORS ?? "",
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
      // Short sessions for staff with access to every shop.
      jwtExpiresIn: "8h",
    },
    cookieOptions: {
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 8 * 60 * 60 * 1000,
    },
  },
})
