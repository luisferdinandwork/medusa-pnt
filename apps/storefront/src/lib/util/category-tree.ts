import { HttpTypes } from "@medusajs/types"

type Category = HttpTypes.StoreProductCategory

export type MenuCategory = {
  id: string
  name: string
  handle: string
  description: string | null
  /** Photo for the menu tile: `metadata.image_url`, else a product thumbnail. */
  image: string | null
  children: MenuCategory[]
}

const byRank = (a: Category, b: Category) => (a.rank ?? 0) - (b.rank ?? 0)

const imageOf = (category: Category) => {
  const fromMetadata = category.metadata?.image_url
  if (typeof fromMetadata === "string" && fromMetadata) {
    return fromMetadata
  }
  return category.products?.find((product) => product.thumbnail)?.thumbnail ?? null
}

/**
 * The top-level categories in admin order, each with its subcategories, for
 * the header menu and the side menu. Built from the flat list listCategories
 * returns, so every level carries its metadata and products.
 */
export const buildCategoryMenu = (categories: Category[]): MenuCategory[] => {
  const toMenu = (category: Category): MenuCategory => ({
    id: category.id,
    name: category.name,
    handle: category.handle,
    description: category.description || null,
    image: imageOf(category),
    children: categories
      .filter((child) => child.parent_category_id === category.id)
      .sort(byRank)
      .map(toMenu),
  })

  return categories
    .filter((category) => !category.parent_category_id)
    .sort(byRank)
    .map(toMenu)
}

/**
 * The category and every category below it. Products are assigned to the
 * deepest category, so a parent page lists its whole branch.
 */
export const categoryBranchIds = (categoryId: string, categories: Category[]) => {
  const ids = [categoryId]
  for (let i = 0; i < ids.length; i++) {
    for (const category of categories) {
      if (category.parent_category_id === ids[i] && !ids.includes(category.id)) {
        ids.push(category.id)
      }
    }
  }
  return ids
}
