import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { CONTENT_MODULE } from "../modules/content"
import ContentModuleService from "../modules/content/service"

// Product stories used to be organised by "silo". The column is now
// `product_name` (renamed by the content module migration); this rewrites the
// copy that still says silo and drops the `silo-` prefix from story handles so
// the storefront no longer shows the word. Runs once, on `medusa db:migrate`.

// The demo copy from seed-content, reworded the same way the seed now is.
const PHRASES: [string, string][] = [
  ["Semua sepatu di silo ini memakai", "Semua model di sini memakai"],
  ["lihat silo AG.", "lihat sepatu bola AG."],
  ["Tiga jalur di dalam silo", "Tiga pilihan model"],
  ["Dua jalur di dalam silo", "Dua pilihan model"],
  ["model di silo ini tetap bekerja", "model-model ini tetap bekerja"],
  [" - Panduan Silo Produk", " - Panduan Produk"],
  ["Silo sepatu bola sol FG:", "Sepatu bola sol FG:"],
  ["Silo sepatu futsal sol IN:", "Sepatu futsal sol IN:"],
  ["Silo daily trainer:", "Daily trainer:"],
  ["Silo race day:", "Race day:"],
  ["Silo apparel latihan:", "Apparel latihan:"],
  ["/stories/silo-", "/stories/"],
]

// `anyWord` also replaces "silo" outside the known phrases. It is used for
// product stories, where the word only ever meant the product grouping.
const rewriteText = (value: string, anyWord: boolean) => {
  let next = value
  for (const [from, to] of PHRASES) {
    next = next.split(from).join(to)
  }
  if (!anyWord) {
    return next
  }
  return next
    .replace(/\bSILO\b/g, "PRODUK")
    .replace(/\bSilo\b/g, "Produk")
    .replace(/\bsilo\b/g, "produk")
}

// Walks strings inside the JSON columns (sections, FAQs, keywords) as well,
// leaving uploaded file URLs alone.
const rewrite = (value: unknown, anyWord: boolean): unknown => {
  if (typeof value === "string") {
    return rewriteText(value, anyWord)
  }
  if (Array.isArray(value)) {
    return value.map((entry) => rewrite(entry, anyWord))
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        key.endsWith("_url") ? entry : rewrite(entry, anyWord),
      ])
    )
  }
  return value
}

const changedFields = <T extends Record<string, unknown>>(
  record: T,
  fields: readonly (keyof T & string)[],
  anyWord: boolean
) => {
  const changes: Record<string, unknown> = {}
  for (const field of fields) {
    const next = rewrite(record[field], anyWord)
    if (JSON.stringify(next) !== JSON.stringify(record[field])) {
      changes[field] = next
    }
  }
  return changes
}

const STORY_FIELDS = [
  "title",
  "subtitle",
  "excerpt",
  "product_name",
  "intro",
  "sections",
  "highlights",
  "faqs",
  "cover_image_alt",
  "cta_label",
  "seo_title",
  "seo_description",
  "seo_keywords",
] as const

const ARTICLE_FIELDS = [
  "title",
  "subtitle",
  "excerpt",
  "content",
  "answer_summary",
  "key_takeaways",
  "faqs",
  "seo_title",
  "seo_description",
  "seo_keywords",
] as const

export default async function removeSiloWording({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const service: ContentModuleService = container.resolve(CONTENT_MODULE)

  const stories = await service.listProductStories({})
  const takenHandles = new Set(stories.map((story) => story.handle))
  let updatedStories = 0

  for (const story of stories) {
    const changes = changedFields(story, STORY_FIELDS, true)

    if (story.handle.startsWith("silo-")) {
      const handle = story.handle.slice("silo-".length)
      if (handle.length >= 2 && !takenHandles.has(handle)) {
        takenHandles.delete(story.handle)
        takenHandles.add(handle)
        changes.handle = handle
      } else {
        logger.warn(
          `Product story "${story.handle}": "${handle}" is taken, handle left unchanged.`
        )
      }
    }

    if (Object.keys(changes).length) {
      await service.updateProductStories({ id: story.id, ...changes })
      updatedStories++
    }
  }

  const articles = await service.listArticles({})
  let updatedArticles = 0

  for (const article of articles) {
    // Articles only get the link fix: their copy may quote URLs that contain
    // the word, and the demo articles never used it.
    const changes = changedFields(article, ARTICLE_FIELDS, false)
    if (Object.keys(changes).length) {
      await service.updateArticles({ id: article.id, ...changes })
      updatedArticles++
    }
  }

  logger.info(
    `Removed "silo" wording from ${updatedStories} product story(ies) and ${updatedArticles} article(s).`
  )
}
