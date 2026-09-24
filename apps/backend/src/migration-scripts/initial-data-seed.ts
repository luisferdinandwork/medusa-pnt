import { MedusaContainer } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  ModuleRegistrationName,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils"
import {
  createApiKeysWorkflow,
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductOptionsWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  createStoresWorkflow,
  createTaxRegionsWorkflow,
  deleteSalesChannelsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows"

export default async function initial_data_seed({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const fulfillmentModuleService = container.resolve(
    ModuleRegistrationName.FULFILLMENT
  )

  const countryCode = "id"

  logger.info("Seeding sales channels...")
  const {
    result: [teamsportChannel, runChannel],
  } = await createSalesChannelsWorkflow(container).run({
    input: {
      salesChannelsData: [
        {
          name: "SPECS Teamsport",
          description: "Sepatu bola dan futsal - specsteamsport.id",
        },
        {
          name: "SPECS Run",
          description: "Running dan lifestyle - specsrun.id",
        },
      ],
    },
  })

  logger.info("Seeding publishable API keys...")
  const {
    result: [teamsportKey],
  } = await createApiKeysWorkflow(container).run({
    input: {
      api_keys: [
        {
          title: "SPECS Teamsport Publishable Key",
          type: "publishable",
          created_by: "",
        },
      ],
    },
  })
  const {
    result: [runKey],
  } = await createApiKeysWorkflow(container).run({
    input: {
      api_keys: [
        {
          title: "SPECS Run Publishable Key",
          type: "publishable",
          created_by: "",
        },
      ],
    },
  })

  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: {
      id: teamsportKey.id,
      add: [teamsportChannel.id],
    },
  })
  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: {
      id: runKey.id,
      add: [runChannel.id],
    },
  })

  logger.info("Seeding store data...")
  // The Medusa framework auto-provisions a default Store + "Default Sales
  // Channel" on first boot if none exists yet (independent of this seed
  // script). Update that store in place instead of creating a second one,
  // and remove the now-unused default channel it came with.
  const { data: existingStores } = await query.graph({
    entity: "store",
    fields: ["id", "default_sales_channel_id"],
  })

  let store: { id: string }
  let staleSalesChannelId: string | undefined

  if (existingStores.length) {
    store = existingStores[0]
    staleSalesChannelId =
      existingStores[0].default_sales_channel_id ?? undefined

    await updateStoresWorkflow(container).run({
      input: {
        selector: { id: store.id },
        update: {
          name: "SPECS Indonesia",
          supported_currencies: [
            {
              currency_code: "idr",
              is_default: true,
            },
          ],
          default_sales_channel_id: teamsportChannel.id,
        },
      },
    })
  } else {
    const {
      result: [newStore],
    } = await createStoresWorkflow(container).run({
      input: {
        stores: [
          {
            name: "SPECS Indonesia",
            supported_currencies: [
              {
                currency_code: "idr",
                is_default: true,
              },
            ],
            default_sales_channel_id: teamsportChannel.id,
          },
        ],
      },
    })
    store = newStore
  }

  // The framework's own auto-provisioning subscriber can create the default
  // store/channel on a slight delay relative to this script, so the store's
  // default_sales_channel_id above isn't a reliable signal - look up any
  // leftover "Default Sales Channel" by name directly as well.
  const { data: leftoverDefaultChannels } = await query.graph({
    entity: "sales_channel",
    fields: ["id"],
    filters: { name: "Default Sales Channel" } as Record<string, unknown>,
  })
  const staleChannelIds = new Set(
    [staleSalesChannelId, ...leftoverDefaultChannels.map((c) => c.id)].filter(
      (id): id is string =>
        !!id && id !== teamsportChannel.id && id !== runChannel.id
    )
  )

  if (staleChannelIds.size) {
    await deleteSalesChannelsWorkflow(container).run({
      input: { ids: Array.from(staleChannelIds) },
    })
  }

  logger.info("Seeding region data...")
  const { result: regionResult } = await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: "Indonesia",
          currency_code: "idr",
          countries: [countryCode],
          payment_providers: ["pp_system_default"],
        },
      ],
    },
  })
  const region = regionResult[0]
  logger.info("Finished seeding regions.")

  logger.info("Seeding tax regions...")
  await createTaxRegionsWorkflow(container).run({
    input: [
      {
        country_code: countryCode,
        provider_id: "tp_system",
      },
    ],
  })
  logger.info("Finished seeding tax regions.")

  logger.info("Seeding stock location data...")
  const { result: stockLocationResult } = await createStockLocationsWorkflow(
    container
  ).run({
    input: {
      locations: [
        {
          name: "Gudang Jakarta",
          address: {
            city: "Jakarta",
            country_code: "ID",
            address_1: "",
          },
        },
      ],
    },
  })
  const stockLocation = stockLocationResult[0]

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_provider_id: "manual_manual",
    },
  })

  logger.info("Seeding fulfillment data...")
  const {
    result: [shippingProfile],
  } = await createShippingProfilesWorkflow(container).run({
    input: {
      data: [
        {
          name: "Default shipping profile",
          type: "default",
        },
      ],
    },
  })

  const fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
    name: "Gudang Jakarta delivery",
    type: "shipping",
    service_zones: [
      {
        name: "Indonesia",
        geo_zones: [
          {
            country_code: countryCode,
            type: "country",
          },
        ],
      },
    ],
  })

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_set_id: fulfillmentSet.id,
    },
  })

  await createShippingOptionsWorkflow(container).run({
    input: [
      {
        name: "Reguler",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Reguler",
          description: "Tiba dalam 2-3 hari kerja.",
          code: "reguler",
        },
        prices: [
          {
            region_id: region.id,
            amount: 15000,
          },
          {
            region_id: region.id,
            amount: 0,
            rules: [
              {
                attribute: "item_total",
                operator: "gte",
                value: 500000,
              },
            ],
          },
        ],
        rules: [
          {
            attribute: "enabled_in_store",
            value: "true",
            operator: "eq",
          },
          {
            attribute: "is_return",
            value: "false",
            operator: "eq",
          },
        ],
      },
      {
        name: "Instan",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Instan",
          description: "Tiba hari ini, 2-4 jam.",
          code: "instan",
        },
        prices: [
          {
            region_id: region.id,
            amount: 35000,
          },
        ],
        rules: [
          {
            attribute: "enabled_in_store",
            value: "true",
            operator: "eq",
          },
          {
            attribute: "is_return",
            value: "false",
            operator: "eq",
          },
        ],
      },
    ],
  })
  logger.info("Finished seeding fulfillment data.")

  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: {
      id: stockLocation.id,
      add: [teamsportChannel.id, runChannel.id],
    },
  })
  logger.info("Finished seeding stock location data.")

  logger.info("Seeding product data...")

  const { result: categoryResult } = await createProductCategoriesWorkflow(
    container
  ).run({
    input: {
      product_categories: [
        { name: "Sepatu Bola", is_active: true },
        { name: "Sepatu Futsal", is_active: true },
        { name: "Sepatu Running", is_active: true },
        { name: "Apparel", is_active: true },
      ],
    },
  })
  const categoryBola = categoryResult.find((c) => c.name === "Sepatu Bola")!
  const categoryFutsal = categoryResult.find((c) => c.name === "Sepatu Futsal")!
  const categoryRunning = categoryResult.find((c) => c.name === "Sepatu Running")!
  const categoryApparel = categoryResult.find((c) => c.name === "Apparel")!

  const { result: productOptionsResult } = await createProductOptionsWorkflow(
    container
  ).run({
    input: {
      product_options: [
        {
          title: "Ukuran",
          values: ["39", "40", "41", "42", "43", "44"],
        },
        {
          title: "Ukuran Baju",
          values: ["S", "M", "L", "XL"],
        },
        {
          title: "Ukuran Kaos Kaki",
          values: ["43-46"],
        },
      ],
    },
  })
  const ukuranOption = productOptionsResult.find((o) => o.title === "Ukuran")!
  const ukuranBajuOption = productOptionsResult.find(
    (o) => o.title === "Ukuran Baju"
  )!
  const ukuranKaosKakiOption = productOptionsResult.find(
    (o) => o.title === "Ukuran Kaos Kaki"
  )!

  // Both channels share the catalog for now - the user will re-split
  // products across SPECS Teamsport / SPECS Run via the admin UI once
  // the real category split between the two storefronts is decided.
  const bothChannels = [{ id: teamsportChannel.id }, { id: runChannel.id }]

  const shoeSizes = ["39", "40", "41", "42", "43", "44"]
  const bajuSizes = ["S", "M", "L", "XL"]

  // Real product names, prices (IDR) and photography sourced from specs.id's
  // public catalog (the real Indonesian brand this storefront is modeled
  // after) - hotlinked directly from their CDN rather than re-hosted.
  type ColorSibling = { handle: string; label: string; hex: string; image: string }

  type ShoeSeed = {
    title: string
    handle: string
    category: { id: string }
    description: string
    weight: number
    price: number
    compareAt?: number
    sku: string
    image: string
    colorSwatch?: string
    colorSiblings?: ColorSibling[]
  }

  const shoeProducts: ShoeSeed[] = [
    // Sepatu Bola (football, FG)
    {
      title: "Specs Lightspeed Reborn Meta SL FG - Icicle/Evergreen",
      handle: "specs-lightspeed-reborn-meta-sl-fg",
      category: categoryBola,
      description:
        "Sepatu bola elite dengan upper rajut satu potong yang ringan dan sol berpelat karbon untuk akselerasi maksimal di rumput asli.",
      weight: 210,
      price: 949800,
      sku: "SPE1010511",
      image:
        "https://www.specs.id/media/catalog/product/s/p/spe1010511-1.jpg?optimize=high&bg-color=255,255,255&fit=bounds&height=800&width=800&canvas=800:800",
    },
    {
      title: "Specs Lightspeed Reborn Meta XR FG - Icicle/Evergreen",
      handle: "specs-lightspeed-reborn-meta-xr-fg",
      category: categoryBola,
      description:
        "Konstruksi ringan dengan traksi presisi untuk pemain yang mengandalkan kecepatan di setiap sprint.",
      weight: 220,
      price: 699800,
      sku: "SPE1010512",
      image:
        "https://www.specs.id/media/catalog/product/s/p/spe1010512-1.jpg?optimize=high&bg-color=255,255,255&fit=bounds&height=800&width=800&canvas=800:800",
    },
    {
      title: "Specs Galactica Morph NV FG - Chilli Pepper/Egret",
      handle: "specs-galactica-morph-nv-fg",
      category: categoryBola,
      description:
        "Upper sintetis dengan area sentuh bola yang diperluas untuk kontrol lebih baik saat menggiring dan mengumpan.",
      weight: 225,
      price: 649800,
      sku: "SPE1010533",
      image:
        "https://www.specs.id/media/catalog/product/s/p/spe1010533-1.jpg?optimize=high&bg-color=255,255,255&fit=bounds&height=800&width=800&canvas=800:800",
    },
    {
      title: "Specs Speedblaze 5 FG - Vintage White/Red/Golden Orange",
      handle: "specs-speedblaze-5-fg",
      category: categoryBola,
      description:
        "Desain aerodinamis dengan sol stud konis untuk cengkeraman maksimal di lapangan rumput asli.",
      weight: 230,
      price: 599800,
      sku: "SPE1010596",
      image:
        "https://www.specs.id/media/catalog/product/s/p/spe1010596-1.jpg?optimize=high&bg-color=255,255,255&fit=bounds&height=800&width=800&canvas=800:800",
    },
    {
      title: "Specs XLR 4 FG - Ice Flow/Oyster Mushroom/White",
      handle: "specs-xlr-4-fg",
      category: categoryBola,
      description:
        "Sepatu bola entry-level dengan upper tahan lama dan sol grip yang andal untuk latihan maupun pertandingan.",
      weight: 235,
      price: 399800,
      sku: "SPE1010591",
      image:
        "https://www.specs.id/media/catalog/product/s/p/spe1010591-1.jpg?optimize=high&bg-color=255,255,255&fit=bounds&height=800&width=800&canvas=800:800",
    },
    {
      title: "Specs Accelerator Illuzion 4 Elite FG - White/Lime Cream",
      handle: "specs-accelerator-illuzion-4-elite-fg",
      category: categoryBola,
      description:
        "Lapisan upper generasi terbaru dengan zona sentuh bola bertekstur untuk kontrol presisi tinggi.",
      weight: 215,
      price: 664860,
      compareAt: 949800,
      sku: "SPE1010334",
      image:
        "https://www.specs.id/media/catalog/product/s/p/spe1010334_1.jpg?optimize=high&bg-color=255,255,255&fit=bounds&height=800&width=800&canvas=800:800",
      colorSwatch: "#E4EFC9",
      colorSiblings: [
        {
          handle: "specs-accelerator-illuzion-4-elite-fg-brook-green",
          label: "Brook Green/Citade",
          hex: "#3C6E52",
          image:
            "https://www.specs.id/media/catalog/product/s/p/spe1010411_1.jpg?optimize=high&bg-color=255,255,255&fit=bounds&height=800&width=800&canvas=800:800",
        },
      ],
    },
    {
      title: "Specs Accelerator Illuzion 4 Elite FG - Brook Green/Citade",
      handle: "specs-accelerator-illuzion-4-elite-fg-brook-green",
      category: categoryBola,
      description:
        "Lapisan upper generasi terbaru dengan zona sentuh bola bertekstur untuk kontrol presisi tinggi.",
      weight: 215,
      price: 949800,
      sku: "SPE1010411",
      image:
        "https://www.specs.id/media/catalog/product/s/p/spe1010411_1.jpg?optimize=high&bg-color=255,255,255&fit=bounds&height=800&width=800&canvas=800:800",
      colorSwatch: "#3C6E52",
      colorSiblings: [
        {
          handle: "specs-accelerator-illuzion-4-elite-fg",
          label: "White/Lime Cream",
          hex: "#E4EFC9",
          image:
            "https://www.specs.id/media/catalog/product/s/p/spe1010334_1.jpg?optimize=high&bg-color=255,255,255&fit=bounds&height=800&width=800&canvas=800:800",
        },
      ],
    },
    // Sepatu Futsal (IN)
    {
      title: "Specs Metasala Nativ RE - Black/Gold",
      handle: "specs-metasala-nativ-re-black-gold",
      category: categoryFutsal,
      description:
        "Sepatu futsal dengan sol non-marking dan upper fleksibel untuk pergerakan cepat di lantai vinyl atau parket.",
      weight: 240,
      price: 499800,
      sku: "SPE1030070",
      image:
        "https://www.specs.id/media/catalog/product/s/p/spe1030070-1.jpg?optimize=high&bg-color=255,255,255&fit=bounds&height=800&width=800&canvas=800:800",
      colorSwatch: "#141210",
      colorSiblings: [
        {
          handle: "specs-metasala-nativ-re-white-teal-silver",
          label: "White/Teal Green/Silver",
          hex: "#2E7D6B",
          image:
            "https://www.specs.id/media/catalog/product/s/p/spe1030071-1.jpg?optimize=high&bg-color=255,255,255&fit=bounds&height=800&width=800&canvas=800:800",
        },
      ],
    },
    {
      title: "Specs Metasala Nativ RE - White/Teal Green/Silver",
      handle: "specs-metasala-nativ-re-white-teal-silver",
      category: categoryFutsal,
      description:
        "Sepatu futsal dengan sol non-marking dan upper fleksibel untuk pergerakan cepat di lantai vinyl atau parket.",
      weight: 240,
      price: 499800,
      sku: "SPE1030071",
      image:
        "https://www.specs.id/media/catalog/product/s/p/spe1030071-1.jpg?optimize=high&bg-color=255,255,255&fit=bounds&height=800&width=800&canvas=800:800",
      colorSwatch: "#2E7D6B",
      colorSiblings: [
        {
          handle: "specs-metasala-nativ-re-black-gold",
          label: "Black/Gold",
          hex: "#141210",
          image:
            "https://www.specs.id/media/catalog/product/s/p/spe1030070-1.jpg?optimize=high&bg-color=255,255,255&fit=bounds&height=800&width=800&canvas=800:800",
        },
      ],
    },
    {
      title: "Specs Accelerator Alpha Fury Pro IN - Glacier Gray/White",
      handle: "specs-accelerator-alpha-fury-pro-in",
      category: categoryFutsal,
      description:
        "Dibuat khusus untuk permukaan indoor dengan traksi multi-arah dan bantalan responsif.",
      weight: 235,
      price: 629820,
      compareAt: 699800,
      sku: "SPE1020363",
      image:
        "https://www.specs.id/media/catalog/product/s/p/spe1020363_1.jpg?optimize=high&bg-color=255,255,255&fit=bounds&height=800&width=800&canvas=800:800",
    },
    {
      title: "Specs Accelerator Lightspeed 4 Nitro Pro IN - White/Regatta",
      handle: "specs-accelerator-lightspeed-4-nitro-pro-in",
      category: categoryFutsal,
      description:
        "Upper ringan dan sol grip pola herringbone untuk akselerasi cepat di lapangan futsal.",
      weight: 230,
      price: 479840,
      compareAt: 599800,
      sku: "SPE1020298",
      image:
        "https://www.specs.id/media/catalog/product/s/p/spe1020298_1.jpg?optimize=high&bg-color=255,255,255&fit=bounds&height=800&width=800&canvas=800:800",
    },
    {
      title: "Specs Accelerator Illuzion 4 Pro IN - White/Lime Cream",
      handle: "specs-accelerator-illuzion-4-pro-in",
      category: categoryFutsal,
      description:
        "Versi indoor dengan zona sentuh bola bertekstur, dioptimalkan untuk permukaan futsal.",
      weight: 232,
      price: 519840,
      compareAt: 649800,
      sku: "SPE1020327",
      image:
        "https://www.specs.id/media/catalog/product/s/p/spe1020327_1.jpg?optimize=high&bg-color=255,255,255&fit=bounds&height=800&width=800&canvas=800:800",
    },
    // Sepatu Running
    {
      title: "Specs Airglide - Black/Dark Grey",
      handle: "specs-airglide",
      category: categoryRunning,
      description:
        "Sepatu lari harian dengan midsole ringan dan upper mesh breathable untuk kenyamanan jarak jauh.",
      weight: 250,
      price: 399800,
      sku: "SPE1040363",
      image:
        "https://www.specs.id/media/catalog/product/s/p/spe1040363-1a.jpg?optimize=high&bg-color=255,255,255&fit=bounds&height=800&width=800&canvas=800:800",
    },
    {
      title: "Specs Novaspeed SubsX - Red Flame/Black/Cream",
      handle: "specs-novaspeed-subsx",
      category: categoryRunning,
      description:
        "Teknologi midsole responsif dengan upper knit adaptif untuk performa lari yang lebih cepat.",
      weight: 240,
      price: 899800,
      sku: "SPE1040186",
      image:
        "https://www.specs.id/media/catalog/product/s/p/spe1040186-1.jpg?optimize=high&bg-color=255,255,255&fit=bounds&height=800&width=800&canvas=800:800",
    },
    {
      title: "Specs Novaspeed Women SubsX - Cream/Ecru/Pink Tint",
      handle: "specs-novaspeed-women-subsx",
      category: categoryRunning,
      description:
        "Dirancang khusus untuk kaki wanita dengan bantalan responsif dan traksi luar ruang yang andal.",
      weight: 220,
      price: 899800,
      sku: "SPE1040188",
      image:
        "https://www.specs.id/media/catalog/product/s/p/spe1040188-1.jpg?optimize=high&bg-color=255,255,255&fit=bounds&height=800&width=800&canvas=800:800",
    },
    {
      title: "Specs Speedvolt - Peacock Blue/Black/White",
      handle: "specs-speedvolt",
      category: categoryRunning,
      description:
        "Sepatu lari ringan dengan sol responsif untuk latihan harian maupun lari jarak jauh.",
      weight: 245,
      price: 549800,
      sku: "SPE1040273",
      image:
        "https://www.specs.id/media/catalog/product/s/p/spe1040273_1.jpg?optimize=high&bg-color=255,255,255&fit=bounds&height=800&width=800&canvas=800:800",
    },
    {
      title: "Specs Speedvolt Women - Sky Light/Majestic Magenta/White",
      handle: "specs-speedvolt-women",
      category: categoryRunning,
      description:
        "Konstruksi ringan dan breathable, dirancang untuk mendukung ritme lari wanita aktif.",
      weight: 225,
      price: 549800,
      sku: "SPE1040277",
      image:
        "https://www.specs.id/media/catalog/product/s/p/spe1040277_1.jpg?optimize=high&bg-color=255,255,255&fit=bounds&height=800&width=800&canvas=800:800",
    },
  ]

  await createProductsWorkflow(container).run({
    input: {
      products: shoeProducts.map((p) => ({
        title: p.title,
        category_ids: [p.category.id],
        description: p.description,
        handle: p.handle,
        weight: p.weight,
        status: ProductStatus.PUBLISHED,
        shipping_profile_id: shippingProfile.id,
        images: [{ url: p.image }],
        thumbnail: p.image,
        metadata: {
          ...(p.compareAt ? { compare_at_amount: p.compareAt } : {}),
          ...(p.colorSwatch ? { color_swatch: p.colorSwatch } : {}),
          ...(p.colorSiblings ? { color_siblings: p.colorSiblings } : {}),
        },
        options: [{ id: ukuranOption.id }],
        variants: shoeSizes.map((size) => ({
          title: size,
          sku: `${p.sku}-${size}`,
          options: { Ukuran: size },
          prices: [{ amount: p.price, currency_code: "idr" }],
        })),
        sales_channels: bothChannels,
      })),
    },
  })

  type ApparelSeed = {
    title: string
    handle: string
    description: string
    weight: number
    price: number
    sku: string
    image: string
    colorSwatch?: string
    colorSiblings?: ColorSibling[]
  }

  const apparelProducts: ApparelSeed[] = [
    {
      title: "Specs Move Mens Training Tee - White",
      handle: "specs-move-mens-training-tee-white",
      description:
        "Kaus latihan quick-dry dengan potongan athletic fit dan panel ventilasi di area punggung.",
      weight: 150,
      price: 199800,
      sku: "SPE2040207",
      image:
        "https://www.specs.id/media/catalog/product/s/p/spe2040207-1.jpg?optimize=high&bg-color=255,255,255&fit=bounds&height=800&width=800&canvas=800:800",
      colorSwatch: "#F5F3EE",
      colorSiblings: [
        {
          handle: "specs-move-mens-training-tee-black",
          label: "Black",
          hex: "#141210",
          image:
            "https://www.specs.id/media/catalog/product/s/p/spe2040206-1.jpg?optimize=high&bg-color=255,255,255&fit=bounds&height=800&width=800&canvas=800:800",
        },
      ],
    },
    {
      title: "Specs Move Mens Training Tee - Black",
      handle: "specs-move-mens-training-tee-black",
      description:
        "Kaus latihan quick-dry dengan potongan athletic fit dan panel ventilasi di area punggung.",
      weight: 150,
      price: 199800,
      sku: "SPE2040206",
      image:
        "https://www.specs.id/media/catalog/product/s/p/spe2040206-1.jpg?optimize=high&bg-color=255,255,255&fit=bounds&height=800&width=800&canvas=800:800",
      colorSwatch: "#141210",
      colorSiblings: [
        {
          handle: "specs-move-mens-training-tee-white",
          label: "White",
          hex: "#F5F3EE",
          image:
            "https://www.specs.id/media/catalog/product/s/p/spe2040207-1.jpg?optimize=high&bg-color=255,255,255&fit=bounds&height=800&width=800&canvas=800:800",
        },
      ],
    },
    {
      title: "Specs Full Length Legging - Folkstone Gray",
      handle: "specs-full-length-legging",
      description:
        "Legging latihan dengan bahan stretch 4-arah dan pinggang tinggi untuk mobilitas penuh.",
      weight: 180,
      price: 349800,
      sku: "SPE2040156",
      image:
        "https://www.specs.id/media/catalog/product/s/p/spe2040156-1a.jpg?optimize=high&bg-color=255,255,255&fit=bounds&height=800&width=800&canvas=800:800",
    },
    {
      title: "Specs Move Womens 7/8 Tight - Folkstone Gray",
      handle: "specs-move-womens-7-8-tight",
      description:
        "Celana latihan wanita dengan potongan 7/8 dan bahan quick-dry yang ringan.",
      weight: 170,
      price: 349800,
      sku: "SPE2050026",
      image:
        "https://www.specs.id/media/catalog/product/s/p/spe2050026-1a.jpg?optimize=high&bg-color=255,255,255&fit=bounds&height=800&width=800&canvas=800:800",
    },
  ]

  await createProductsWorkflow(container).run({
    input: {
      products: apparelProducts.map((p) => ({
        title: p.title,
        category_ids: [categoryApparel.id],
        description: p.description,
        handle: p.handle,
        weight: p.weight,
        status: ProductStatus.PUBLISHED,
        shipping_profile_id: shippingProfile.id,
        images: [{ url: p.image }],
        thumbnail: p.image,
        metadata: {
          ...(p.colorSwatch ? { color_swatch: p.colorSwatch } : {}),
          ...(p.colorSiblings ? { color_siblings: p.colorSiblings } : {}),
        },
        options: [{ id: ukuranBajuOption.id }],
        variants: bajuSizes.map((size) => ({
          title: size,
          sku: `${p.sku}-${size}`,
          options: { "Ukuran Baju": size },
          prices: [{ amount: p.price, currency_code: "idr" }],
        })),
        sales_channels: bothChannels,
      })),
    },
  })

  await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title: "Specs Run Lite Quarter Socks - White",
          category_ids: [categoryApparel.id],
          description:
            "Kaus kaki lari ringan dengan bantalan di area tumit dan ventilasi mesh.",
          handle: "specs-run-lite-quarter-socks-white",
          weight: 60,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            {
              url: "https://www.specs.id/media/catalog/product/s/p/spe3040042-1.jpg?optimize=high&bg-color=255,255,255&fit=bounds&height=800&width=800&canvas=800:800",
            },
          ],
          thumbnail:
            "https://www.specs.id/media/catalog/product/s/p/spe3040042-1.jpg?optimize=high&bg-color=255,255,255&fit=bounds&height=800&width=800&canvas=800:800",
          options: [{ id: ukuranKaosKakiOption.id }],
          variants: [
            {
              title: "43-46",
              sku: "SPE3040042-4346",
              options: { "Ukuran Kaos Kaki": "43-46" },
              prices: [{ amount: 49800, currency_code: "idr" }],
            },
          ],
          sales_channels: bothChannels,
        },
      ],
    },
  })
  logger.info("Finished seeding product data.")

  logger.info("Seeding inventory levels.")

  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id", "sku"],
  })

  // A few low-stock variants to exercise the "Sisa N" badge in the storefront.
  const lowStockSkus = new Set([
    "SPE1010334-44",
    "SPE1030070-42",
    "SPE3040042-4346",
  ])

  await createInventoryLevelsWorkflow(container).run({
    input: {
      inventory_levels: inventoryItems.map((item) => ({
        location_id: stockLocation.id,
        stocked_quantity: lowStockSkus.has(item.sku ?? "") ? 3 : 250,
        inventory_item_id: item.id,
      })),
    },
  })

  logger.info("Finished seeding inventory levels data.")

  logger.info("=================================================")
  logger.info("SPECS Teamsport publishable key: " + teamsportKey.token)
  logger.info("SPECS Run publishable key:       " + runKey.token)
  logger.info("=================================================")
  logger.info(
    "Copy each key into the matching storefront's NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY."
  )
}
