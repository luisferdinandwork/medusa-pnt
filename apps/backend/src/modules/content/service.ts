import { MedusaService } from "@medusajs/framework/utils"
import Article from "./models/article"
import ProductStory from "./models/product-story"

class ContentModuleService extends MedusaService({
  Article,
  ProductStory,
}) {}

export default ContentModuleService
