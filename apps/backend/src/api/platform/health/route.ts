import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/** Connection check for the Emora platform: the shop's name and that its database answers. */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const started = Date.now()
  const { data } = await query.graph({ entity: "store", fields: ["id", "name"] })
  return res.json({
    ok: true,
    shop: process.env.EMORA_SHOP ?? null,
    store_name: data[0]?.name ?? null,
    database_ms: Date.now() - started,
    server_time: new Date().toISOString(),
  })
}
