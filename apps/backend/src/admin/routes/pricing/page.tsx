import { defineRouteConfig } from "@medusajs/admin-sdk"
import { MagnifyingGlass, PencilSquare } from "@medusajs/icons"
import {
  Badge,
  Button,
  Container,
  Heading,
  Input,
  StatusBadge,
  Table,
  Text,
} from "@medusajs/ui"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  formatRange,
  SALE_STATE_COLOR,
  SALE_STATE_LABEL,
  salePeriodText,
} from "../../components/pricing/money"
import { PricingDrawer } from "../../components/pricing/pricing-editor"
import {
  PRICING_LIST_QUERY_KEY,
  type ProductPricingRow,
} from "../../components/pricing/types"
import { sdk } from "../../lib/sdk"

const PAGE_SIZE = 20

type ListResponse = {
  products: ProductPricingRow[]
  currency_code: string
  count: number
}

// Every product's regular and sale price on one page, each editable in place.
// Listed under Products in the sidebar; the same editor sits on each product
// page ("Price & sale" card).
const PricingPage = () => {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [q, setQ] = useState("")
  const [page, setPage] = useState(0)
  const [editing, setEditing] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setQ(search.trim())
      setPage(0)
    }, 250)
    return () => clearTimeout(timer)
  }, [search])

  const { data, isLoading } = useQuery({
    queryKey: [...PRICING_LIST_QUERY_KEY, q, page],
    queryFn: () =>
      sdk.client.fetch<ListResponse>("/admin/product-pricing", {
        query: { q: q || undefined, limit: PAGE_SIZE, offset: page * PAGE_SIZE },
      }),
    placeholderData: keepPreviousData,
  })

  const count = data?.count ?? 0
  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE))
  const currency = data?.currency_code ?? "idr"

  return (
    <Container className="divide-y p-0">
      <div className="flex flex-col gap-y-3 px-6 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Heading>Prices &amp; sales</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Regular and sale price of every product. Click a row to change them; a sale can
            have its own start and end date.
          </Text>
        </div>
        <div className="w-full md:w-72">
          <Input
            type="search"
            size="small"
            placeholder="Search products"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Product</Table.HeaderCell>
            <Table.HeaderCell>Regular price</Table.HeaderCell>
            <Table.HeaderCell>Sale price</Table.HeaderCell>
            <Table.HeaderCell>Sale</Table.HeaderCell>
            <Table.HeaderCell />
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {isLoading && (
            <Table.Row>
              <Table.Cell>Loading...</Table.Cell>
            </Table.Row>
          )}
          {!isLoading && data?.products.length === 0 && (
            <Table.Row>
              <Table.Cell>
                <Text size="small" className="text-ui-fg-muted flex items-center gap-x-2">
                  <MagnifyingGlass />
                  No products match.
                </Text>
              </Table.Cell>
            </Table.Row>
          )}
          {data?.products.map((row) => (
            <Table.Row
              key={row.id}
              className="cursor-pointer [&_td:last-child]:w-[1%] [&_td:last-child]:whitespace-nowrap"
              onClick={() => setEditing(row.id)}
            >
              <Table.Cell>
                <div className="flex items-center gap-x-3 py-1">
                  <div className="bg-ui-bg-subtle h-10 w-8 shrink-0 overflow-hidden rounded">
                    {row.thumbnail && (
                      <img src={row.thumbnail} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <Text size="small" weight="plus" className="max-w-[320px] truncate">
                      {row.title}
                    </Text>
                    <Text size="xsmall" className="text-ui-fg-muted">
                      {row.variant_count} variant(s)
                      {row.missing_price_count > 0 && (
                        <span className="text-ui-fg-error"> - {row.missing_price_count} without price</span>
                      )}
                      {row.legacy_compare_at !== null && (
                        <span className="text-ui-tag-orange-text"> - old &quot;was&quot; price label</span>
                      )}
                    </Text>
                  </div>
                </div>
              </Table.Cell>
              <Table.Cell>
                <Text
                  size="small"
                  className={row.sale?.state === "live" ? "text-ui-fg-muted line-through" : undefined}
                >
                  {row.base_range ? formatRange(row.base_range, currency) : "-"}
                </Text>
              </Table.Cell>
              <Table.Cell>
                {row.sale_range ? (
                  <Text size="small" weight="plus" className="text-ui-fg-error">
                    {formatRange(row.sale_range, currency)}
                  </Text>
                ) : (
                  <Text size="small" className="text-ui-fg-muted">-</Text>
                )}
              </Table.Cell>
              <Table.Cell>
                <div className="flex flex-wrap items-center gap-1">
                  {row.sale ? (
                    <>
                      <StatusBadge color={SALE_STATE_COLOR[row.sale.state]}>
                        {SALE_STATE_LABEL[row.sale.state]}
                      </StatusBadge>
                      <Text size="xsmall" className="text-ui-fg-subtle">
                        {salePeriodText(row.sale)}
                      </Text>
                    </>
                  ) : (
                    <Text size="small" className="text-ui-fg-muted">
                      {row.legacy_compare_at !== null ? "Label only" : "Off"}
                    </Text>
                  )}
                  {row.other_price_list_count > 0 && (
                    <Badge size="2xsmall" className="whitespace-nowrap">
                      +{row.other_price_list_count} price list
                    </Badge>
                  )}
                </div>
              </Table.Cell>
              <Table.Cell>
                <div className="flex items-center gap-x-1">
                  <Button
                    size="small"
                    variant="transparent"
                    onClick={(event) => {
                      event.stopPropagation()
                      setEditing(row.id)
                    }}
                  >
                    <PencilSquare />
                    Edit
                  </Button>
                  <Button
                    size="small"
                    variant="transparent"
                    onClick={(event) => {
                      event.stopPropagation()
                      navigate(`/products/${row.id}`)
                    }}
                  >
                    Open
                  </Button>
                </div>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>

      <div className="flex items-center justify-between px-6 py-3">
        <Text size="small" className="text-ui-fg-subtle">
          {count} product(s)
        </Text>
        <div className="flex items-center gap-x-2">
          <Button size="small" variant="secondary" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <Text size="small" className="text-ui-fg-subtle">
            {page + 1} / {pages}
          </Text>
          <Button
            size="small"
            variant="secondary"
            disabled={page + 1 >= pages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      <PricingDrawer
        productId={editing}
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
      />
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Prices & sales",
  nested: "/products",
})

export default PricingPage
