import { MagnifyingGlass, Plus, XMarkMini } from "@medusajs/icons"
import { Button, Input, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { sdk } from "../../lib/sdk"

type PickerProduct = { id: string; title: string; handle?: string | null }

/**
 * Picks products by handle. Handles are what the storefront matches on, so the
 * value stays portable across environments even when product ids differ.
 */
export const ProductPicker = ({
  value,
  onChange,
  max = 40,
}: {
  value: string[]
  onChange: (value: string[]) => void
  max?: number
}) => {
  const [search, setSearch] = useState("")
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 250)
    return () => clearTimeout(timer)
  }, [search])

  const { data, isFetching } = useQuery({
    queryKey: ["content-product-search", query],
    queryFn: () =>
      sdk.admin.product.list({
        q: query || undefined,
        limit: 8,
        fields: "id,title,handle",
      }),
    enabled: open,
  })

  // Resolve titles for the handles already selected, so chips are readable.
  const { data: selectedData } = useQuery({
    queryKey: ["content-product-handles", value.join(",")],
    queryFn: () =>
      sdk.admin.product.list({
        handle: value,
        limit: value.length,
        fields: "id,title,handle",
      }),
    enabled: value.length > 0,
    retry: false,
  })

  const titleByHandle = new Map<string, string>()
  for (const product of (selectedData?.products ?? []) as PickerProduct[]) {
    if (product.handle) {
      titleByHandle.set(product.handle, product.title)
    }
  }

  const results = ((data?.products ?? []) as PickerProduct[]).filter(
    (product) => product.handle && !value.includes(product.handle)
  )

  return (
    <div className="flex flex-col gap-y-2">
      {value.length > 0 && (
        <div className="flex flex-col gap-y-1">
          {value.map((handle) => (
            <div
              key={handle}
              className="bg-ui-bg-subtle border-ui-border-base flex items-center justify-between gap-x-2 rounded-md border px-2.5 py-1.5"
            >
              <div className="min-w-0">
                <Text size="small" className="truncate">
                  {titleByHandle.get(handle) ?? handle}
                </Text>
                {titleByHandle.has(handle) && (
                  <Text size="xsmall" className="text-ui-fg-muted truncate">
                    {handle}
                  </Text>
                )}
              </div>
              <button
                type="button"
                aria-label={`Hapus ${handle}`}
                className="text-ui-fg-muted hover:text-ui-fg-base shrink-0"
                onClick={() =>
                  onChange(value.filter((entry) => entry !== handle))
                }
              >
                <XMarkMini />
              </button>
            </div>
          ))}
        </div>
      )}

      {open ? (
        <div className="border-ui-border-base flex flex-col gap-y-2 rounded-lg border p-2">
          <Input
            autoFocus
            value={search}
            placeholder="Cari produk..."
            onChange={(event) => setSearch(event.target.value)}
          />
          <div className="flex max-h-56 flex-col gap-y-1 overflow-y-auto">
            {isFetching && (
              <Text size="small" className="text-ui-fg-muted px-1 py-2">
                Mencari...
              </Text>
            )}
            {!isFetching && results.length === 0 && (
              <Text size="small" className="text-ui-fg-muted px-1 py-2">
                Tidak ada produk yang cocok.
              </Text>
            )}
            {results.map((product) => (
              <button
                key={product.id}
                type="button"
                className="hover:bg-ui-bg-base-hover flex flex-col items-start rounded-md px-2 py-1.5 text-left"
                onClick={() => {
                  if (product.handle && value.length < max) {
                    onChange([...value, product.handle])
                  }
                }}
              >
                <Text size="small">{product.title}</Text>
                <Text size="xsmall" className="text-ui-fg-muted">
                  {product.handle}
                </Text>
              </button>
            ))}
          </div>
          <Button
            size="small"
            variant="transparent"
            className="w-fit"
            onClick={() => setOpen(false)}
          >
            Selesai
          </Button>
        </div>
      ) : (
        <Button
          size="small"
          variant="secondary"
          className="w-fit"
          disabled={value.length >= max}
          onClick={() => setOpen(true)}
        >
          <Plus />
          Tambah produk
        </Button>
      )}

      {!open && value.length === 0 && (
        <Text size="xsmall" className="text-ui-fg-muted flex items-center gap-x-1">
          <MagnifyingGlass />
          Belum ada produk yang ditautkan.
        </Text>
      )}
    </div>
  )
}
