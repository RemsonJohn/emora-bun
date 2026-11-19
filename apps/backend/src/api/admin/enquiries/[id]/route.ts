import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { updateEnquiryWorkflow } from "../../../../workflows/enquiries"
import type { UpdateEnquiryBody } from "../validators"

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({ entity: "enquiry", fields: ["*"], filters: { id: req.params.id } })
  if (!data[0]) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Enquiry not found")
  return res.json({ enquiry: data[0] })
}

export async function POST(req: AuthenticatedMedusaRequest<UpdateEnquiryBody>, res: MedusaResponse) {
  const { result } = await updateEnquiryWorkflow(req.scope).run({
    input: { id: req.params.id, ...req.validatedBody },
  })
  return res.json({ enquiry: result })
}
