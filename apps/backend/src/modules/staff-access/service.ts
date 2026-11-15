import { MedusaService } from "@medusajs/framework/utils"
import { StaffGrant } from "./models/staff-grant"

export default class StaffAccessService extends MedusaService({ StaffGrant }) {}
