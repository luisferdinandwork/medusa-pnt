import { MedusaService } from "@medusajs/framework/utils"
import Storefront from "./models/storefront"

class StorefrontModuleService extends MedusaService({
  Storefront,
}) {}

export default StorefrontModuleService
