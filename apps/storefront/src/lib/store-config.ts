export type GuideCard = {
  eyebrow: string
  title: string
  description: string
}

export type StoreConfig = {
  key: string
  name: string
  shortName: string
  tagline: string
  defaultTitle: string
  defaultDescription: string
  /** One announcement bar segment per entry; an empty list hides the bar. */
  announcementItems: string[]
  /** Homepage hero. An empty heading hides the hero section. */
  hero: {
    eyebrow: string
    heading: string
    body: string
    price: string
    comparePrice: string
    badge: string
    ctaLabel: string
  }
  /** Homepage editorial story. An empty heading hides the section. */
  editorial: {
    eyebrow: string
    heading: string
    body: string
    ctaLabel: string
    /** Photo next to the story; empty shows a plain panel. */
    imageUrl: string
    imageAlt: string
  }
  /** Homepage buying-guide cards. An empty list hides the section. */
  guideCards: GuideCard[]
}

const DEFAULT_ANNOUNCEMENT = [
  "GRATIS KIRIM DI ATAS RP 500.000",
  "TUKAR UKURAN 30 HARI",
  "CARI TOKO TERDEKAT",
]

const DEFAULT_HERO: StoreConfig["hero"] = {
  eyebrow: "Drop 09 - Musim 2026",
  heading: "Accelerator\n*Infinity* FG",
  body: "Sol cetakan baru dengan pelat karbon separuh panjang, upper rajut satu potong yang membungkus kaki tanpa jahitan. Dibuat untuk pemain yang menentukan tempo.",
  price: "Rp 1.349.000",
  comparePrice: "Rp 1.599.000",
  badge: "Hemat 16%",
  ctaLabel: "Beli Sekarang",
}

const DEFAULT_EDITORIAL: StoreConfig["editorial"] = {
  eyebrow: "Cerita lapangan",
  heading: "Dari lapangan kampung,\nke rumput stadion.",
  body: "Rizky bermain tanpa sepatu sampai umur dua belas. Musim ini ia mencetak sembilan gol di liga provinsi - dengan Barricada yang sama yang dipakai anak-anak di lapangan belakang rumahnya.",
  ctaLabel: "Baca ceritanya",
  imageUrl: "",
  imageAlt: "",
}

const DEFAULT_GUIDE_CARDS: GuideCard[] = [
  {
    eyebrow: "Panduan",
    title: "FG, AG, atau TF?",
    description:
      "Tiga huruf yang menentukan cengkeraman dan umur sepatumu. Panduan singkat memilih sol sesuai permukaan yang paling sering kamu pakai.",
  },
  {
    eyebrow: "Perawatan",
    title: "Merawat upper rajut",
    description:
      "Jangan dijemur langsung, jangan disikat kasar. Enam langkah agar bentuk sepatu tetap presisi setelah musim hujan.",
  },
  {
    eyebrow: "Ukuran",
    title: "Setengah nomor naik?",
    description:
      "Cara mengukur kaki di rumah dengan kertas dan penggaris, dan kapan sebaiknya ambil setengah nomor lebih besar.",
  },
]

// Fallback used only when the backend has no Storefront record for this
// publishable key (or is unreachable). The live values are edited in the Medusa
// admin under "Storefronts" and read through getStoreConfig().
const PRESETS: Record<string, StoreConfig> = {
  "specs-teamsport": {
    key: "specs-teamsport",
    name: "SPECS Teamsport",
    shortName: "SPECS",
    tagline: "Sepatu Bola & Futsal",
    defaultTitle: "SPECS Teamsport | Sepatu Bola & Futsal Resmi",
    defaultDescription:
      "Belanja sepatu bola, futsal, dan apparel tim resmi SPECS.",
    announcementItems: DEFAULT_ANNOUNCEMENT,
    hero: DEFAULT_HERO,
    editorial: DEFAULT_EDITORIAL,
    guideCards: DEFAULT_GUIDE_CARDS,
  },
  "specs-run": {
    key: "specs-run",
    name: "SPECS Run",
    shortName: "SPECS",
    tagline: "Running & Lifestyle",
    defaultTitle: "SPECS Run | Sepatu Lari & Lifestyle",
    defaultDescription: "Belanja sepatu lari dan apparel lifestyle SPECS.",
    announcementItems: DEFAULT_ANNOUNCEMENT,
    hero: DEFAULT_HERO,
    editorial: DEFAULT_EDITORIAL,
    guideCards: DEFAULT_GUIDE_CARDS,
  },
}

const key = process.env.NEXT_PUBLIC_STORE_KEY || "specs-teamsport"

export const fallbackStoreConfig: StoreConfig =
  PRESETS[key] ?? PRESETS["specs-teamsport"]
