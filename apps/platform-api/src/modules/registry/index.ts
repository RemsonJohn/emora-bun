import { Module } from "@medusajs/framework/utils"
import RegistryModuleService from "./service"

export const REGISTRY_MODULE = "registry"
export default Module(REGISTRY_MODULE, { service: RegistryModuleService })
