import { createStep, createWorkflow, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { ENQUIRY_MODULE } from "../modules/enquiry"
import type EnquiryModuleService from "../modules/enquiry/service"

export type CreateEnquiryInput = {
  kind: "bulk_order"
  name: string
  phone: string
  email?: string | null
  organisation?: string | null
  details: Record<string, unknown>
}

const createEnquiryStep = createStep(
  "create-enquiry",
  async (input: CreateEnquiryInput, { container }) => {
    const service = container.resolve<EnquiryModuleService>(ENQUIRY_MODULE)
    const enquiry = await service.createEnquiries(input)
    return new StepResponse(enquiry, enquiry.id)
  },
  async (id, { container }) => {
    if (!id) return
    await container.resolve<EnquiryModuleService>(ENQUIRY_MODULE).deleteEnquiries(id)
  }
)

export const createEnquiryWorkflow = createWorkflow("create-enquiry", (input: CreateEnquiryInput) => {
  return new WorkflowResponse(createEnquiryStep(input))
})

export type UpdateEnquiryInput = {
  id: string
  status?: "new" | "quoted" | "won" | "lost"
  staff_notes?: string | null
}

const updateEnquiryStep = createStep(
  "update-enquiry",
  async (input: UpdateEnquiryInput, { container }) => {
    const service = container.resolve<EnquiryModuleService>(ENQUIRY_MODULE)
    const previous = await service.retrieveEnquiry(input.id)
    const updated = await service.updateEnquiries(input)
    return new StepResponse(updated, { id: previous.id, status: previous.status, staff_notes: previous.staff_notes })
  },
  async (previous, { container }) => {
    if (!previous) return
    await container.resolve<EnquiryModuleService>(ENQUIRY_MODULE).updateEnquiries(previous)
  }
)

export const updateEnquiryWorkflow = createWorkflow("update-enquiry", (input: UpdateEnquiryInput) => {
  return new WorkflowResponse(updateEnquiryStep(input))
})
