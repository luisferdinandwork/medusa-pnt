import { XMarkMini } from "@medusajs/icons"
import { Input, Select, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { sdk } from "../../lib/sdk"
import { type BannerLinkType, LINK_TYPE_LABEL } from "./types"

type Option = { value: string; label: string; hint?: string }

const useCategoryOptions = (enabled: boolean) =>
  useQuery({
    queryKey: ["banner-link-categories"],
    enabled,
    queryFn: async (): Promise<Option[]> => {
      const { product_categories } = await sdk.admin.productCategory.list({
        limit: 500,
        fields: "id,name,handle,parent_category_id,is_active",
      })
      return product_categories.map((category) => ({
        value: category.handle,
        label: category.name,
        hint: category.parent_category_id ? "subcategory" : undefined,
      }))
    },
  })

const useCollectionOptions = (enabled: boolean) =>
  useQuery({
    queryKey: ["banner-link-collections"],
    enabled,
    queryFn: async (): Promise<Option[]> => {
      const { collections } = await sdk.admin.productCollection.list({
        limit: 500,
        fields: "id,title,handle",
      })
      return collections.map((collection) => ({
        value: collection.handle,
        label: collection.title,
      }))
    },
  })

const HandleSelect = ({
  value,
  onChange,
  options,
  isLoading,
  noun,
}: {
  value: string
  onChange: (value: string) => void
  options: Option[]
  isLoading: boolean
  noun: string
}) => {
  const missing = value && !isLoading && !options.some((option) => option.value === value)
  return (
    <div className="flex flex-col gap-y-1">
      <Select value={value || undefined} onValueChange={onChange}>
        <Select.Trigger>
          <Select.Value placeholder={isLoading ? "Loading..." : `Choose a ${noun}`} />
        </Select.Trigger>
        <Select.Content>
          {options.map((option) => (
            <Select.Item key={option.value} value={option.value}>
              {option.label}
              {option.hint && <span className="text-ui-fg-muted"> ({option.hint})</span>}
            </Select.Item>
          ))}
        </Select.Content>
      </Select>
      {missing && (
        <Text size="xsmall" className="text-ui-fg-error">
          No {noun} with the handle &quot;{value}&quot; exists any more. The banner links nowhere
          until you choose another.
        </Text>
      )}
    </div>
  )
}

const ProductSelect = ({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) => {
  const [search, setSearch] = useState("")
  const [q, setQ] = useState("")

  useEffect(() => {
    const timer = setTimeout(() => setQ(search.trim()), 250)
    return () => clearTimeout(timer)
  }, [search])

  const { data: selected } = useQuery({
    queryKey: ["banner-link-product", value],
    enabled: !!value,
    queryFn: () =>
      sdk.admin.product
        .list({ handle: value, limit: 1, fields: "id,title,handle,thumbnail" })
        .then(({ products }) => products[0] ?? null),
  })

  const { data: results, isFetching } = useQuery({
    queryKey: ["banner-link-product-search", q],
    enabled: !value,
    queryFn: () =>
      sdk.admin.product
        .list({ q: q || undefined, limit: 8, fields: "id,title,handle,thumbnail" })
        .then(({ products }) => products),
  })

  if (value) {
    return (
      <div className="bg-ui-bg-subtle border-ui-border-base flex items-center gap-x-3 rounded-md border px-2.5 py-2">
        {selected?.thumbnail && (
          <img src={selected.thumbnail} alt="" className="h-9 w-9 rounded object-cover" />
        )}
        <div className="min-w-0 flex-1">
          <Text size="small" weight="plus" className="truncate">
            {selected?.title ?? value}
          </Text>
          <Text size="xsmall" className="text-ui-fg-muted truncate">
            {selected === null ? `Not found: ${value}` : value}
          </Text>
        </div>
        <button
          type="button"
          aria-label="Choose another product"
          className="text-ui-fg-muted hover:text-ui-fg-base"
          onClick={() => onChange("")}
        >
          <XMarkMini />
        </button>
      </div>
    )
  }

  return (
    <div className="border-ui-border-base flex flex-col gap-y-2 rounded-lg border p-2">
      <Input
        size="small"
        type="search"
        placeholder="Search products"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <div className="flex max-h-56 flex-col overflow-y-auto">
        {isFetching && (
          <Text size="small" className="text-ui-fg-muted px-1 py-2">
            Searching...
          </Text>
        )}
        {!isFetching && !results?.length && (
          <Text size="small" className="text-ui-fg-muted px-1 py-2">
            No products match.
          </Text>
        )}
        {results?.map((product) => (
          <button
            key={product.id}
            type="button"
            className="hover:bg-ui-bg-base-hover flex items-center gap-x-2 rounded-md px-2 py-1.5 text-left"
            onClick={() => product.handle && onChange(product.handle)}
          >
            {product.thumbnail && (
              <img src={product.thumbnail} alt="" className="h-8 w-8 rounded object-cover" />
            )}
            <div className="min-w-0">
              <Text size="small" className="truncate">{product.title}</Text>
              <Text size="xsmall" className="text-ui-fg-muted truncate">{product.handle}</Text>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

/** Where tapping the banner takes the shopper. */
export const LinkPicker = ({
  type,
  value,
  onChange,
}: {
  type: BannerLinkType
  value: string
  onChange: (type: BannerLinkType, value: string) => void
}) => {
  const categories = useCategoryOptions(type === "category")
  const collections = useCollectionOptions(type === "collection")

  return (
    <div className="flex flex-col gap-y-2">
      <Select
        value={type}
        onValueChange={(next) => onChange(next as BannerLinkType, "")}
      >
        <Select.Trigger>
          <Select.Value />
        </Select.Trigger>
        <Select.Content>
          {(Object.keys(LINK_TYPE_LABEL) as BannerLinkType[]).map((key) => (
            <Select.Item key={key} value={key}>
              {LINK_TYPE_LABEL[key]}
            </Select.Item>
          ))}
        </Select.Content>
      </Select>

      {type === "category" && (
        <HandleSelect
          noun="category"
          value={value}
          onChange={(next) => onChange(type, next)}
          options={categories.data ?? []}
          isLoading={categories.isLoading}
        />
      )}
      {type === "collection" && (
        <HandleSelect
          noun="collection"
          value={value}
          onChange={(next) => onChange(type, next)}
          options={collections.data ?? []}
          isLoading={collections.isLoading}
        />
      )}
      {type === "product" && (
        <ProductSelect value={value} onChange={(next) => onChange(type, next)} />
      )}
      {type === "url" && (
        <>
          <Input
            value={value}
            placeholder="/store  or  https://..."
            onChange={(event) => onChange(type, event.target.value)}
          />
          <Text size="xsmall" className="text-ui-fg-subtle">
            A path in the shop (starting with /, e.g. /store or /blog) or a full address.
          </Text>
        </>
      )}
    </div>
  )
}

/** Short description of a banner's target for cards and lists. */
export const describeLink = (type: BannerLinkType, value: string) =>
  `${LINK_TYPE_LABEL[type]}: ${value}`
