import type { MedusaContainer } from "@medusajs/framework/types"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import jwt from "jsonwebtoken"

export default async function smokeStaffAccess({ container }: { container: MedusaContainer }) {
  const users = container.resolve(Modules.USER)
  const [user] = await users.listUsers({}, { take: 1 })
  if (!user || !process.env.JWT_SECRET) throw new MedusaError(MedusaError.Types.INVALID_DATA, "An existing user and JWT secret are required")
  const token = jwt.sign({ actor_id: user.id, actor_type: "user", auth_identity_id: "staff-smoke-check", app_metadata: {} }, process.env.JWT_SECRET, { expiresIn: "30s" })
  const response = await fetch("http://localhost:9000/admin/staff-access/me", { headers: { Authorization: `Bearer ${token}` } })
  const body = await response.json() as { role?: string }
  console.info(`Staff access endpoint: HTTP ${response.status}; role: ${body.role || "unavailable"}.`)
  if (!response.ok || body.role !== "admin") throw new MedusaError(MedusaError.Types.INVALID_DATA, "The existing administrator could not be verified")
  const locking = container.resolve(Modules.LOCKING)
  const key = `emora-staff-smoke-${Date.now()}`
  await locking.acquire(key, { ownerId: key })
  await locking.release(key, { ownerId: key })
  console.info("PostgreSQL staff locking is available.")
}
