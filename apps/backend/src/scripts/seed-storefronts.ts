import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createStorefrontWorkflow } from "../workflows/create-storefront"
import { StorefrontData } from "../modules/storefront/types"

type SeedStorefront = StorefrontData & { sales_channel_name: string }

// The copy each storefront had hardcoded before it became editable in the
// admin (Storefronts page). Safe to re-run: existing keys are skipped.
const STOREFRONTS: SeedStorefront[] = [
  {
    key: "specs-teamsport",
    sales_channel_name: "SPECS Teamsport",
    name: "SPECS Teamsport",
    short_name: "SPECS",
    tagline: "Sepatu Bola & Futsal",
    default_title: "SPECS Teamsport | Sepatu Bola & Futsal Resmi",
    default_description:
      "Belanja sepatu bola, futsal, dan apparel tim resmi SPECS.",
    announcement_items: [
      "GRATIS KIRIM DI ATAS RP 500.000",
      "TUKAR UKURAN 30 HARI",
      "CARI TOKO TERDEKAT",
    ],
    hero_eyebrow: "Drop 09 - Musim 2026",
    hero_heading: "Accelerator\n*Infinity* FG",
    hero_body:
      "Sol cetakan baru dengan pelat karbon separuh panjang, upper rajut satu potong yang membungkus kaki tanpa jahitan. Dibuat untuk pemain yang menentukan tempo.",
    hero_price: "Rp 1.349.000",
    hero_compare_price: "Rp 1.599.000",
    hero_badge: "Hemat 16%",
    hero_cta_label: "Beli Sekarang",
  },
  {
    key: "specs-run",
    sales_channel_name: "SPECS Run",
    name: "SPECS Run",
    short_name: "SPECS",
    tagline: "Running & Lifestyle",
    default_title: "SPECS Run | Sepatu Lari & Lifestyle",
    default_description: "Belanja sepatu lari dan apparel lifestyle SPECS.",
    announcement_items: [
      "GRATIS KIRIM DI ATAS RP 500.000",
      "TUKAR UKURAN 30 HARI",
      "CARI TOKO TERDEKAT",
    ],
    hero_eyebrow: "Drop 09 - Musim 2026",
    hero_heading: "Accelerator\n*Infinity* FG",
    hero_body:
      "Sol cetakan baru dengan pelat karbon separuh panjang, upper rajut satu potong yang membungkus kaki tanpa jahitan. Dibuat untuk pemain yang menentukan tempo.",
    hero_price: "Rp 1.349.000",
    hero_compare_price: "Rp 1.599.000",
    hero_badge: "Hemat 16%",
    hero_cta_label: "Beli Sekarang",
  },
  {
    key: "specs-b2b",
    sales_channel_name: "SPECS B2B",
    name: "SPECS B2B",
    short_name: "SPECS B2B",
    tagline: "Portal Grosir untuk Mitra",
    default_title: "SPECS B2B | Toko Grosir",
    default_description:
      "Portal pemesanan grosir SPECS untuk reseller dan mitra bisnis.",
    announcement_items: [
      "HARGA GROSIR UNTUK MITRA TERDAFTAR",
      "PEMBAYARAN VIA TRANSFER BANK",
    ],
  },
]

export default async function seedStorefronts({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: existing } = await query.graph({
    entity: "storefront",
    fields: ["key"],
  })
  const existingKeys = new Set(existing.map((s) => s.key))

  const { data: channels } = await query.graph({
    entity: "sales_channel",
    fields: ["id", "name"],
  })

  for (const { sales_channel_name, ...storefront } of STOREFRONTS) {
    if (existingKeys.has(storefront.key)) {
      logger.info(`Storefront "${storefront.key}" already exists, skipping.`)
      continue
    }

    const channel = channels.find((c) => c.name === sales_channel_name)
    if (!channel) {
      logger.warn(
        `Sales channel "${sales_channel_name}" not found, skipping "${storefront.key}".`
      )
      continue
    }

    await createStorefrontWorkflow(container).run({
      input: { storefront, sales_channel_id: channel.id },
    })
    logger.info(`Created storefront "${storefront.key}" -> ${channel.name}.`)
  }
}
