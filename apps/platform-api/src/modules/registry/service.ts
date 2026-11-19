import { MedusaService } from "@medusajs/framework/utils"
import { AuditEvent } from "./models/audit-event"
import { Merchant } from "./models/merchant"

export default class RegistryModuleService extends MedusaService({ Merchant, AuditEvent }) {}
