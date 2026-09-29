"use server"

import { sdk } from "@lib/config"
import { getCacheOptions } from "./cookies"

export type Faq = { question: string; answer: string }
export type Source = { label: string; url: string }
export type StorySection = {
  heading: string
  body: string
  image_url?: string | null
  image_alt?: string | null
}
export type StoryHighlight = { label: string; value: string }

export type Article = {
  id: string
  handle: string
  title: string
  subtitle: string | null
  excerpt: string | null
  content: string | null
  published_at: string | null
  category: string | null
  tags: string[] | null
  cover_image_url: string | null
  cover_image_alt: string | null
  read_minutes: number | null
  author_name: string | null
  author_role: string | null
  is_featured: boolean
  seo_title: string | null
  seo_description: string | null
  seo_keywords: string[] | null
  canonical_url: string | null
  og_image_url: string | null
  noindex: boolean
  answer_summary: string | null
  key_takeaways: string[] | null
  faqs: Faq[] | null
  sources: Source[] | null
  geo_locale: string | null
  geo_target_area: string | null
  related_product_handles: string[] | null
  related_category_handles: string[] | null
  created_at: string
  updated_at: string
}

export type ProductStory = {
  id: string
  handle: string
  title: string
  subtitle: string | null
  excerpt: string | null
  product_name: string
  category_handle: string | null
  product_handles: string[] | null
  intro: string | null
  sections: StorySection[] | null
  highlights: StoryHighlight[] | null
  faqs: Faq[] | null
  cover_image_url: string | null
  cover_image_alt: string | null
  cta_label: string | null
  cta_href: string | null
  published_at: string | null
  seo_title: string | null
  seo_description: string | null
  seo_keywords: string[] | null
  created_at: string
  updated_at: string
}

// Editorial is public and identical for every visitor of a storefront, so it is
// cached for a minute rather than per request.
const editorialFetch = { revalidate: 60 } as const

export const listArticles = async (
  query: Record<string, string> = {}
): Promise<{ articles: Article[]; count: number }> => {
  const next = { ...(await getCacheOptions("articles")), ...editorialFetch }

  try {
    return await sdk.client.fetch<{ articles: Article[]; count: number }>(
      "/store/articles",
      { query, next }
    )
  } catch {
    return { articles: [], count: 0 }
  }
}

export const getArticle = async (
  handle: string
): Promise<{ article: Article; related: Article[] } | null> => {
  const next = { ...(await getCacheOptions("articles")), ...editorialFetch }

  try {
    return await sdk.client.fetch<{ article: Article; related: Article[] }>(
      `/store/articles/${handle}`,
      { next }
    )
  } catch {
    return null
  }
}

export const listProductStories = async (
  query: Record<string, string> = {}
): Promise<{ product_stories: ProductStory[]; count: number }> => {
  const next = {
    ...(await getCacheOptions("product-stories")),
    ...editorialFetch,
  }

  try {
    return await sdk.client.fetch<{
      product_stories: ProductStory[]
      count: number
    }>("/store/product-stories", { query, next })
  } catch {
    return { product_stories: [], count: 0 }
  }
}

export const getProductStory = async (
  handle: string
): Promise<{
  product_story: ProductStory
  related: ProductStory[]
} | null> => {
  const next = {
    ...(await getCacheOptions("product-stories")),
    ...editorialFetch,
  }

  try {
    return await sdk.client.fetch<{
      product_story: ProductStory
      related: ProductStory[]
    }>(`/store/product-stories/${handle}`, { next })
  } catch {
    return null
  }
}

/** The story that lists this product, used on product pages. */
export const getStoryForProduct = async (
  productHandle: string
): Promise<ProductStory | null> => {
  const { product_stories } = await listProductStories({
    product_handle: productHandle,
    limit: "1",
  })

  return product_stories[0] ?? null
}
