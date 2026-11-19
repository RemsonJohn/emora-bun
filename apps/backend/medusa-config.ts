import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

// Each shop runs this backend with its own environment file and database
// (see SHOPS.md). Razorpay is registered only when that shop's keys are set.
const razorpayProvider = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  ? [{
      resolve: "./src/modules/razorpay",
      id: "razorpay",
      options: {
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
        webhook_secret: process.env.RAZORPAY_WEBHOOK_SECRET,
      },
    }]
  : []

export default defineConfig({
  modules: [
    { resolve: "./src/modules/staff-access" },
    { resolve: "./src/modules/enquiry" },
    { resolve: "@medusajs/medusa/locking", options: { providers: [{ resolve: "@medusajs/medusa/locking-postgres", id: "locking-postgres", is_default: true }] } },
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          // Cash on delivery (pp_manual_cod) and pay later for international orders (pp_manual_paylater).
          { resolve: "./src/modules/manual-payment", id: "cod" },
          { resolve: "./src/modules/manual-payment", id: "paylater" },
          ...razorpayProvider,
        ],
      },
    },
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
