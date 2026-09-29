import { ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils"
import {
  createProductCategoriesWorkflow,
  createProductOptionsWorkflow,
  createProductsWorkflow,
  updateProductCategoriesWorkflow,
  updateProductOptionsWorkflow,
  updateProductsWorkflow,
} from "@medusajs/medusa/core-flows"
import { updateProductPricingWorkflow } from "../workflows/update-product-pricing"
import {
  CATALOG_PRODUCTS,
  type CatalogOption,
  EXISTING_GALLERIES,
} from "./data/specs-catalog"
import seedOmnichannel from "./seed-omnichannel"

// The storefront catalog in four main categories - Footwear, Apparel,
// Accessories, Equipment - each with subcategories, filled with SPECS products
// and photo galleries from specs.id (scripts/data/specs-catalog.ts).
// Safe to re-run: categories and size options are created or updated in place,
// products whose handle exists are skipped, and existing products only get a
// gallery when they still have a single photo.

type CategorySpec = {
  handle: string
  name: string
  description?: string
  /** Product whose first photo represents the category in the menu. */
  imageFrom?: string
  children?: CategorySpec[]
}

const CATEGORY_TREE: CategorySpec[] = [
  {
    handle: "footwear",
    name: "Footwear",
    description: "Sepatu bola, futsal, dan lari SPECS.",
    children: [
      { handle: "sepatu-bola", name: "Sepatu Bola", imageFrom: "specs-lightspeed-reborn-meta-sl-fg" },
      { handle: "sepatu-futsal", name: "Sepatu Futsal", imageFrom: "specs-metasala-nativ-re-black-gold" },
      { handle: "sepatu-running", name: "Sepatu Running", imageFrom: "specs-novaspeed-subsx" },
    ],
  },
  {
    handle: "apparel",
    name: "Apparel",
    description: "Jersey, kaos, celana, dan jaket untuk latihan dan pertandingan.",
    children: [
      { handle: "jersey", name: "Jersey", imageFrom: "specs-garuda-attack-jersey-red-paprika" },
      { handle: "kaos-tank", name: "Kaos & Tank Top", imageFrom: "specs-src-speed-lab-r-mens-tee-blue-sapphire" },
      { handle: "celana", name: "Celana", imageFrom: "specs-src-speed-lab-r-mens-short-5-inch-navy" },
      { handle: "jaket", name: "Jaket", imageFrom: "specs-skylite-running-jacket-black" },
    ],
  },
  {
    handle: "accessories",
    name: "Accessories",
    description: "Kaus kaki, tas, dan topi untuk melengkapi perlengkapanmu.",
    children: [
      { handle: "kaos-kaki", name: "Kaos Kaki", imageFrom: "specs-garuda-attack-26-socks-blood-red-white" },
      { handle: "tas", name: "Tas", imageFrom: "specs-drive-backpack-grey-khaki" },
      { handle: "topi-headwear", name: "Topi & Headband", imageFrom: "specs-src-novaswift-lightweight-cap-white" },
    ],
  },
  {
    handle: "equipment",
    name: "Equipment",
    description: "Bola, sarung tangan kiper, pelindung, dan perlengkapan latihan.",
    children: [
      { handle: "bola", name: "Bola", imageFrom: "specs-spinova-futsal-match-ball-white-red-paprika-black" },
      { handle: "sarung-tangan-kiper", name: "Sarung Tangan Kiper", imageFrom: "specs-xponent-2-goalkeeper-gloves-black-sharp-green" },
      { handle: "pelindung", name: "Pelindung", imageFrom: "specs-shockwave-shin-guard-black" },
      { handle: "perlengkapan-latihan", name: "Perlengkapan Latihan", imageFrom: "specs-ground-disc-set-12-pcs-hanger" },
    ],
  },
]

// The initial seed put these in the flat "Apparel" category.
const CATEGORY_MOVES: Record<string, string> = {
  "specs-move-mens-training-tee-white": "kaos-tank",
  "specs-move-mens-training-tee-black": "kaos-tank",
  "specs-full-length-legging": "celana",
  "specs-move-womens-7-8-tight": "celana",
  "specs-run-lite-quarter-socks-white": "kaos-kaki",
}

// Shared size options, so the storefront filter shows one "Ukuran ..." group
// per kind of product. Existing values are kept.
const OPTION_VALUES: Record<CatalogOption, string[]> = {
  "Ukuran Baju": ["S", "M", "L", "XL", "XXL"],
  "Ukuran Kaos Kaki": ["39-42", "43-46"],
  "Ukuran Bola": ["3", "4", "5"],
  "Ukuran Sarung Tangan": ["8", "9", "10", "11"],
  "Ukuran Aksesoris": ["One Size", "S", "M", "L", "S/M", "L/XL"],
}

// Size order shown on product pages and filters (option value ranks).
const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "S/M", "L/XL", "One Size"]
const compareSizes = (a: string, b: string) => {
  const ia = SIZE_ORDER.indexOf(a)
  const ib = SIZE_ORDER.indexOf(b)
  if (ia !== -1 || ib !== -1) {
    return (ia === -1 ? SIZE_ORDER.length : ia) - (ib === -1 ? SIZE_ORDER.length : ib)
  }
  // "39", "39-42": by the first number.
  const na = Number.parseFloat(a)
  const nb = Number.parseFloat(b)
  if (!Number.isNaN(na) && !Number.isNaN(nb) && na !== nb) {
    return na - nb
  }
  return a.localeCompare(b)
}

const SALES_CHANNELS = ["SPECS Teamsport", "SPECS Run"]
const CURRENCY = "idr"

const photoOf = (handle: string) =>
  CATALOG_PRODUCTS.find((p) => p.handle === handle)?.images[0] ??
  EXISTING_GALLERIES[handle]?.[0]

const skuSuffix = (size: string) => size.replace(/[^A-Za-z0-9]/g, "").toUpperCase()

export default async function seedCatalog({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const productModule = container.resolve(Modules.PRODUCT)
  const fulfillmentModule = container.resolve(Modules.FULFILLMENT)

  // 1. Category tree.
  const loadCategories = async () =>
    (
      await query.graph({
        entity: "product_category",
        fields: ["id", "handle", "parent_category_id", "metadata"],
      })
    ).data
  let categories = await loadCategories()
  const idOf = (handle: string) => categories.find((c) => c.handle === handle)?.id

  const ensureCategory = async (spec: CategorySpec, rank: number, parentId: string | null) => {
    const metadata = spec.imageFrom ? { image_url: photoOf(spec.imageFrom) } : undefined
    const existing = categories.find((c) => c.handle === spec.handle)
    if (existing) {
      await updateProductCategoriesWorkflow(container).run({
        input: {
          selector: { id: existing.id },
          update: {
            parent_category_id: parentId,
            rank,
            is_active: true,
            ...(spec.description ? { description: spec.description } : {}),
            ...(metadata ? { metadata: { ...(existing.metadata ?? {}), ...metadata } } : {}),
          },
        },
      })
    } else {
      await createProductCategoriesWorkflow(container).run({
        input: {
          product_categories: [
            {
              name: spec.name,
              handle: spec.handle,
              description: spec.description,
              parent_category_id: parentId,
              rank,
              is_active: true,
              ...(metadata ? { metadata } : {}),
            },
          ],
        },
      })
      logger.info(`Created category "${spec.name}".`)
    }
    categories = await loadCategories()
    return idOf(spec.handle)!
  }

  for (const [index, top] of CATEGORY_TREE.entries()) {
    const topId = await ensureCategory(top, index, null)
    for (const [childIndex, child] of (top.children ?? []).entries()) {
      await ensureCategory(child, childIndex, topId)
    }
  }
  logger.info("Category tree: Footwear, Apparel, Accessories, Equipment.")

  // 2. Shared size options, with their values ranked S, M, L, XL / 39, 40...
  const rankValues = (values: string[]) => {
    const sorted = [...new Set(values)].sort(compareSizes)
    return { values: sorted, ranks: Object.fromEntries(sorted.map((v, i) => [v, i])) }
  }
  const optionIds = {} as Record<CatalogOption, string>
  for (const [title, values] of Object.entries(OPTION_VALUES) as [CatalogOption, string[]][]) {
    const [option] = await productModule.listProductOptions(
      { title, is_exclusive: false },
      { relations: ["values"] }
    )
    if (!option) {
      const { result } = await createProductOptionsWorkflow(container).run({
        input: { product_options: [{ title, ...rankValues(values) }] },
      })
      optionIds[title] = result[0].id
      continue
    }
    const current = (option.values ?? []).map((v) => v.value)
    await updateProductOptionsWorkflow(container).run({
      input: { selector: { id: option.id }, update: rankValues([...current, ...values]) },
    })
    optionIds[title] = option.id
  }
  // The initial seed's shoe size option.
  const [shoeSizes] = await productModule.listProductOptions(
    { title: "Ukuran", is_exclusive: false },
    { relations: ["values"] }
  )
  if (shoeSizes) {
    await updateProductOptionsWorkflow(container).run({
      input: {
        selector: { id: shoeSizes.id },
        update: rankValues((shoeSizes.values ?? []).map((v) => v.value)),
      },
    })
  }
  const valueIdsFor = async (title: CatalogOption, sizes: string[]) => {
    const [option] = await productModule.listProductOptions(
      { id: optionIds[title] },
      { relations: ["values"] }
    )
    return (option.values ?? []).filter((v) => sizes.includes(v.value)).map((v) => v.id)
  }

  // 3. Existing products: full galleries and the new apparel subcategories.
  const { data: existing } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "images.id", "categories.handle"],
  })
  const existingHandles = new Set(existing.map((p) => p.handle))
  let galleries = 0
  let moved = 0
  for (const product of existing) {
    const gallery = EXISTING_GALLERIES[product.handle]
    const addGallery = !!gallery && (product.images?.length ?? 0) <= 1
    const target = CATEGORY_MOVES[product.handle]
    const move =
      !!target &&
      (product.categories ?? []).length === 1 &&
      product.categories?.[0]?.handle === "apparel"
    if (!addGallery && !move) {
      continue
    }
    await updateProductsWorkflow(container).run({
      input: {
        products: [
          {
            id: product.id,
            ...(addGallery
              ? { images: gallery.map((url) => ({ url })), thumbnail: gallery[0] }
              : {}),
            ...(move ? { category_ids: [idOf(target)!] } : {}),
          },
        ],
      },
    })
    galleries += addGallery ? 1 : 0
    moved += move ? 1 : 0
  }
  logger.info(`Added galleries to ${galleries} product(s), moved ${moved} into subcategories.`)

  // 4. New products.
  const { data: channels } = await query.graph({
    entity: "sales_channel",
    fields: ["id", "name"],
  })
  const salesChannels = channels
    .filter((c) => SALES_CHANNELS.includes(c.name))
    .map((c) => ({ id: c.id }))
  const [shippingProfile] = await fulfillmentModule.listShippingProfiles({ type: "default" })

  const toCreate = CATALOG_PRODUCTS.filter((p) => !existingHandles.has(p.handle))
  const created: { id: string; handle: string }[] = []
  for (const product of toCreate) {
    const { result } = await createProductsWorkflow(container).run({
      input: {
        products: [
          {
            title: product.title,
            handle: product.handle,
            description: product.description,
            status: ProductStatus.PUBLISHED,
            weight: product.weight,
            category_ids: [idOf(product.category)!],
            shipping_profile_id: shippingProfile?.id,
            images: product.images.map((url) => ({ url })),
            thumbnail: product.images[0],
            metadata: { source_url: product.source },
            options: [
              {
                id: optionIds[product.option],
                value_ids: await valueIdsFor(product.option, product.sizes),
              },
            ],
            variants: product.sizes.map((size) => ({
              title: size,
              sku: `${product.sku}-${skuSuffix(size)}`,
              options: { [product.option]: size },
              prices: [{ amount: product.price, currency_code: CURRENCY }],
            })),
            sales_channels: salesChannels,
          },
        ],
      },
    })
    created.push({ id: result[0].id, handle: product.handle })
  }
  logger.info(`Created ${created.length} product(s), skipped ${CATALOG_PRODUCTS.length - created.length} that exist.`)

  // 5. specs.id's current discounts become real sale prices (Products > Prices & sales).
  let sales = 0
  for (const { id, handle } of created) {
    const product = CATALOG_PRODUCTS.find((p) => p.handle === handle)!
    if (!product.salePrice) {
      continue
    }
    const { data } = await query.graph({
      entity: "product",
      fields: ["variants.id"],
      filters: { id },
    })
    await updateProductPricingWorkflow(container).run({
      input: {
        product_id: id,
        currency_code: CURRENCY,
        variants: (data[0]?.variants ?? []).map((variant) => ({
          id: variant.id,
          sale_amount: product.salePrice,
        })),
      },
    })
    sales++
  }
  logger.info(`Put ${sales} new product(s) on sale.`)

  // 6. Stock for the new variants at the warehouse and stores.
  if (created.length) {
    await seedOmnichannel({ container, args: [] } as unknown as ExecArgs)
  }
}
