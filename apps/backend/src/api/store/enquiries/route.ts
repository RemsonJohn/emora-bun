import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { createEnquiryWorkflow } from "../../../workflows/enquiries"
import type { CreateEnquiryBody } from "../validators"

/** Saves a bulk order enquiry. Only the reference is returned to the shopper. */
export async function POST(req: MedusaRequest<CreateEnquiryBody>, res: MedusaResponse) {
  const { result } = await createEnquiryWorkflow(req.scope).run({ input: req.validatedBody })
  return res.status(201).json({ enquiry: { id: result.id, status: result.status } })
}
