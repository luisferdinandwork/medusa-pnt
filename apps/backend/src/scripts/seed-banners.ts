import { readFile } from "node:fs/promises"
import path from "node:path"
import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { uploadFilesWorkflow } from "@medusajs/medusa/core-flows"
import { BANNER_MODULE } from "../modules/banner"
import BannerModuleService from "../modules/banner/service"
import { BannerData } from "../modules/banner/types"
import { createBannerWorkflow } from "../workflows/create-banner"
import { deleteBannerWorkflow } from "../workflows/delete-banner"
import { updateStorefrontWorkflow } from "../workflows/update-storefront"

// Homepage banners for the SPECS storefronts. The photos are SPECS campaign
// banners from specs.id, cropped per section (seed-assets/banners): slides and
// feature banners 1920x900 with a 720x900 phone crop, category tiles 4:5,
// promos 4:3. They are uploaded through the File Module like an admin upload,
// so they can be replaced from Storefronts > Banners. Storefronts with a
// homepage story but no photo also get one (Storefronts > Homepage).
// Safe to re-run: storefronts that already have banners are skipped. Pass
// `refresh` (`npm run seed:banners:refresh`) to replace their banners with
// these - edits made in the admin are lost.

const ASSET_DIR = path.resolve(process.cwd(), "seed-assets", "banners")

type SeedBanner = Omit<
  BannerData,
  "storefront_key" | "image_url" | "mobile_image_url"
> & {
  image: string
  mobile_image?: string
}

const TEAMSPORT: SeedBanner[] = [
  {
    placement: "hero",
    image: "hero-garuda-attack",
    mobile_image: "hero-garuda-attack-mobile",
    image_alt: "Pemain berseragam merah dengan sepatu bola SPECS Garuda Attack",
    eyebrow: "Koleksi Garuda Attack",
    title: "Berani tampil di lapangan",
    subtitle: "Sepatu bola untuk pemain yang main dengan hati Merah Putih.",
    cta_label: "Belanja Sepatu Bola",
    link_type: "category",
    link_value: "sepatu-bola",
  },
  {
    placement: "hero",
    image: "hero-lightspeed-reborn-meta",
    mobile_image: "hero-lightspeed-reborn-meta-mobile",
    image_alt: "Sepatu bola SPECS Lightspeed Reborn Meta warna hijau es",
    eyebrow: "Drop baru",
    title: "Lightspeed Reborn Meta",
    subtitle: "Upper rajut satu potong, dibuat untuk akselerasi di rumput asli.",
    cta_label: "Lihat Produk",
    link_type: "product",
    link_value: "specs-lightspeed-reborn-meta-sl-fg",
  },
  {
    placement: "hero",
    image: "hero-jersey-timnas",
    mobile_image: "category-apparel-jersey",
    image_alt: "Dua model memakai jersey merah dan hitam berlambang Garuda",
    eyebrow: "Apparel",
    title: "Pakai Merah Putih",
    subtitle: "Jersey dan apparel tim untuk latihan dan hari pertandingan.",
    cta_label: "Belanja Apparel",
    text_align: "right",
    link_type: "category",
    link_value: "apparel",
  },
  {
    placement: "category",
    image: "category-sepatu-bola",
    image_alt: "Sepatu bola SPECS Lightspeed Reborn merah",
    title: "Sepatu Bola",
    cta_label: "Belanja",
    link_type: "category",
    link_value: "sepatu-bola",
  },
  {
    placement: "category",
    image: "category-sepatu-futsal",
    image_alt: "Sepatu futsal SPECS Metasala Nativ tergantung di kabel",
    title: "Sepatu Futsal",
    cta_label: "Belanja",
    link_type: "category",
    link_value: "sepatu-futsal",
  },
  {
    placement: "category",
    image: "category-sepatu-running",
    image_alt: "Sepatu lari SPECS Flyride di langit biru",
    title: "Sepatu Running",
    cta_label: "Belanja",
    link_type: "category",
    link_value: "sepatu-running",
  },
  {
    placement: "category",
    image: "category-apparel-running",
    image_alt: "Pelari memakai kaos tanpa lengan SPECS",
    title: "Apparel",
    cta_label: "Belanja",
    link_type: "category",
    link_value: "apparel",
  },
  {
    placement: "promo",
    image: "promo-galactica-morph-nv",
    image_alt: "Sepatu bola SPECS Galactica Morph NV putih hijau",
    eyebrow: "Sepatu Bola FG",
    title: "Galactica Morph NV",
    subtitle: "Kontrol bola yang presisi untuk pengatur tempo.",
    cta_label: "Lihat Produk",
    link_type: "product",
    link_value: "specs-galactica-morph-nv-fg",
  },
  {
    placement: "promo",
    image: "promo-novaspeed",
    image_alt: "Lima pelari memakai sepatu SPECS Novaspeed",
    eyebrow: "Running",
    title: "Novaspeed SubsX",
    subtitle: "Ringan dan responsif untuk lari tempo.",
    cta_label: "Lihat Produk",
    link_type: "product",
    link_value: "specs-novaspeed-subsx",
  },
  {
    placement: "feature",
    image: "feature-lightspeed-5",
    mobile_image: "feature-lightspeed-5-mobile",
    image_alt: "Pemain memegang sepatu bola SPECS Accelerator Lightspeed 5",
    eyebrow: "Accelerator Lightspeed",
    cta_label: "Belanja Sepatu Bola",
    link_type: "category",
    link_value: "sepatu-bola",
  },
]

const RUN: SeedBanner[] = [
  {
    placement: "hero",
    image: "hero-running-apparel",
    mobile_image: "hero-running-apparel-mobile",
    image_alt: "Tiga pelari memakai apparel SPECS Running Concept di hutan",
    eyebrow: "SPECS Running Concept",
    title: "Lari lebih jauh",
    subtitle: "Apparel lari yang ringan dan cepat kering untuk latihan harian.",
    cta_label: "Belanja Apparel",
    link_type: "category",
    link_value: "apparel",
  },
  {
    placement: "hero",
    image: "hero-flyride",
    mobile_image: "category-sepatu-running",
    image_alt: "Empat sepatu lari SPECS Flyride melayang di langit biru",
    eyebrow: "Every Run Series",
    title: "Flyride",
    subtitle: "Bantalan empuk untuk lari santai setiap hari.",
    cta_label: "Belanja Sepatu Running",
    text_theme: "dark",
    link_type: "category",
    link_value: "sepatu-running",
  },
  {
    placement: "category",
    image: "category-sepatu-running-studio",
    image_alt: "Sepatu lari SPECS warna kuning neon",
    title: "Sepatu Running",
    cta_label: "Belanja",
    link_type: "category",
    link_value: "sepatu-running",
  },
  {
    placement: "category",
    image: "category-apparel-jersey",
    image_alt: "Model memakai jersey merah dan hitam",
    title: "Apparel",
    cta_label: "Belanja",
    link_type: "category",
    link_value: "apparel",
  },
  {
    placement: "category",
    image: "category-sepatu-bola",
    image_alt: "Sepatu bola SPECS Lightspeed Reborn merah",
    title: "Sepatu Bola",
    cta_label: "Belanja",
    link_type: "category",
    link_value: "sepatu-bola",
  },
  {
    placement: "category",
    image: "category-sepatu-futsal",
    image_alt: "Sepatu futsal SPECS Metasala Nativ",
    title: "Sepatu Futsal",
    cta_label: "Belanja",
    link_type: "category",
    link_value: "sepatu-futsal",
  },
  {
    placement: "promo",
    image: "promo-novaspeed",
    image_alt: "Lima pelari memakai sepatu SPECS Novaspeed",
    eyebrow: "Sepatu lari",
    title: "Novaspeed SubsX",
    subtitle: "Ringan dan responsif untuk lari tempo.",
    cta_label: "Lihat Produk",
    link_type: "product",
    link_value: "specs-novaspeed-subsx",
  },
  {
    placement: "promo",
    image: "promo-speedvolt",
    image_alt: "Deretan sepatu lari SPECS Speedvolt warna-warni",
    eyebrow: "Sepatu lari",
    title: "Speedvolt",
    subtitle: "Pilihan warna cerah untuk lari harian.",
    cta_label: "Lihat Produk",
    text_theme: "dark",
    link_type: "product",
    link_value: "specs-speedvolt",
  },
  {
    placement: "feature",
    image: "feature-104-nx",
    mobile_image: "feature-104-nx-mobile",
    image_alt: "Sepatu SPECS 104 NX hitam dipakai berjalan",
    cta_label: "Belanja Sepatu Running",
    text_theme: "dark",
    link_type: "category",
    link_value: "sepatu-running",
  },
]

const BANNERS_BY_STOREFRONT: Record<string, SeedBanner[]> = {
  "specs-teamsport": TEAMSPORT,
  "specs-run": RUN,
}

// Photo for the homepage story ("Dari lapangan kampung, ke rumput stadion"),
// set on storefronts that have a story but no photo yet.
const EDITORIAL_PHOTO = {
  image: "editorial-stadium",
  alt: "Bola SPECS di atas rumput stadion",
}

export default async function seedBanners({ container, args }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const bannerService: BannerModuleService = container.resolve(BANNER_MODULE)
  const refresh = (args ?? []).includes("refresh")

  const { data: storefronts } = await query.graph({
    entity: "storefront",
    fields: ["id", "key", "editorial_heading", "editorial_image_url"],
  })
  const storefrontKeys = new Set(storefronts.map((s) => s.key))

  // One upload per file, shared by every banner (and storefront) that uses it.
  const uploaded = new Map<string, string>()
  const upload = async (name: string) => {
    const cached = uploaded.get(name)
    if (cached) {
      return cached
    }
    const content = await readFile(path.join(ASSET_DIR, `${name}.webp`))
    const { result } = await uploadFilesWorkflow(container).run({
      input: {
        files: [
          {
            filename: `banner-${name}.webp`,
            mimeType: "image/webp",
            content: content.toString("base64"),
            access: "public",
          },
        ],
      },
    })
    uploaded.set(name, result[0].url)
    return result[0].url
  }

  for (const [storefrontKey, seeds] of Object.entries(BANNERS_BY_STOREFRONT)) {
    if (!storefrontKeys.has(storefrontKey)) {
      logger.warn(
        `Storefront "${storefrontKey}" not found (run seed:storefronts first), skipping its banners.`
      )
      continue
    }

    const existing = await bannerService.listBanners({
      storefront_key: storefrontKey,
    })
    if (existing.length && !refresh) {
      logger.info(
        `Storefront "${storefrontKey}" already has ${existing.length} banner(s), skipping.`
      )
      continue
    }
    for (const banner of existing) {
      await deleteBannerWorkflow(container).run({ input: { id: banner.id } })
    }

    for (const [index, { image, mobile_image, ...banner }] of seeds.entries()) {
      await createBannerWorkflow(container).run({
        input: {
          ...banner,
          storefront_key: storefrontKey,
          image_url: await upload(image),
          mobile_image_url: mobile_image ? await upload(mobile_image) : null,
          // Seeds are listed in homepage order within each section.
          rank: seeds.slice(0, index).filter((s) => s.placement === banner.placement).length,
        },
      })
    }
    logger.info(
      `${existing.length ? "Replaced" : "Created"} ${seeds.length} banner(s) for "${storefrontKey}".`
    )
  }

  for (const storefront of storefronts) {
    if (
      !BANNERS_BY_STOREFRONT[storefront.key] ||
      !storefront.editorial_heading ||
      (storefront.editorial_image_url && !refresh)
    ) {
      continue
    }
    await updateStorefrontWorkflow(container).run({
      input: {
        id: storefront.id,
        data: {
          editorial_image_url: await upload(EDITORIAL_PHOTO.image),
          editorial_image_alt: EDITORIAL_PHOTO.alt,
        },
      },
    })
    logger.info(`Set the homepage story photo of "${storefront.key}".`)
  }
}
