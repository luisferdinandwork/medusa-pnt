import type { Article, Faq, ProductStory } from "@lib/data/content"
import { stripMarkdown } from "@lib/util/markdown"

type Crumb = { name: string; url: string }

export const breadcrumbSchema = (items: Crumb[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: item.url,
  })),
})

export const faqSchema = (faqs: Faq[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer },
  })),
})

export const articleSchema = (
  article: Article,
  { url, siteName }: { url: string; siteName: string }
) => {
  const body = article.content ? stripMarkdown(article.content) : ""

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.seo_title || article.title,
    description:
      article.seo_description || article.excerpt || body.slice(0, 200),
    // The answer-first paragraph, which is what an assistant is most likely to
    // quote back to a reader.
    abstract: article.answer_summary || undefined,
    articleSection: article.category || undefined,
    keywords: (article.seo_keywords ?? article.tags ?? []).join(", ") || undefined,
    inLanguage: article.geo_locale || "id-ID",
    datePublished: article.published_at || article.created_at,
    dateModified: article.updated_at,
    wordCount: body ? body.split(/\s+/).length : undefined,
    timeRequired: article.read_minutes ? `PT${article.read_minutes}M` : undefined,
    image: article.cover_image_url || article.og_image_url || undefined,
    author: {
      "@type": article.author_name ? "Person" : "Organization",
      name: article.author_name || siteName,
    },
    publisher: { "@type": "Organization", name: siteName },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    ...(article.geo_target_area
      ? { contentLocation: { "@type": "Place", name: article.geo_target_area } }
      : {}),
  }
}

export const storySchema = (
  story: ProductStory,
  { url, siteName, productUrls }: {
    url: string
    siteName: string
    productUrls: { name: string; url: string }[]
  }
) => ({
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: story.seo_title || story.title,
  description: story.seo_description || story.excerpt || story.intro || undefined,
  inLanguage: "id-ID",
  datePublished: story.published_at || story.created_at,
  dateModified: story.updated_at,
  image: story.cover_image_url || undefined,
  publisher: { "@type": "Organization", name: siteName },
  mainEntityOfPage: { "@type": "WebPage", "@id": url },
  mainEntity: {
    "@type": "ItemList",
    numberOfItems: productUrls.length,
    itemListElement: productUrls.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: product.name,
      url: product.url,
    })),
  },
})

export const blogListSchema = (
  articles: Article[],
  { url, siteName, baseUrl }: { url: string; siteName: string; baseUrl: string }
) => ({
  "@context": "https://schema.org",
  "@type": "Blog",
  name: `${siteName} Journal`,
  url,
  inLanguage: "id-ID",
  blogPost: articles.slice(0, 20).map((article) => ({
    "@type": "BlogPosting",
    headline: article.title,
    description: article.excerpt || undefined,
    datePublished: article.published_at || article.created_at,
    url: `${baseUrl}/blog/${article.handle}`,
  })),
})
