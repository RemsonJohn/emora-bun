import { Module } from "@medusajs/framework/utils"
import StaffAccessService from "./service"

export const STAFF_ACCESS_MODULE = "staffAccess"
export default Module(STAFF_ACCESS_MODULE, { service: StaffAccessService })
