import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { addLookToCartWorkflow } from "../../../../../workflows/add-look-to-cart"
import type { AddLookBody } from "../../../validators"

/** Adds a Complete the Look set (kurti plus matching pieces) to the cart. */
export async function POST(req: MedusaRequest<AddLookBody>, res: MedusaResponse) {
  const { result } = await addLookToCartWorkflow(req.scope).run({
    input: { cart_id: req.params.id, ...req.validatedBody },
  })
  return res.json({ set_key: result.set_key })
}
