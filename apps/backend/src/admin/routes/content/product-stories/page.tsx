import { defineRouteConfig } from "@medusajs/admin-sdk"
import { MagnifyingGlass, Plus } from "@medusajs/icons"
import {
  Badge,
  Button,
  Container,
  Heading,
  Input,
  Select,
  Table,
  Text,
} from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  ALL_STOREFRONTS,
  type ProductStory,
} from "../../../components/content/types"
import { formatDate, PublishBadge } from "../../../components/content/ui"
import { useStorefronts } from "../../../components/content/use-storefronts"
import { sdk } from "../../../lib/sdk"

const PAGE_SIZE = 20

const ProductStoriesPage = () => {
  const navigate = useNavigate()
  const storefronts = useStorefronts()

  const [search, setSearch] = useState("")
  const [q, setQ] = useState("")
  const [status, setStatus] = useState("all")
  const [storefront, setStorefront] = useState(ALL_STOREFRONTS)
  const [page, setPage] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      setQ(search.trim())
      setPage(0)
    }, 250)
    return () => clearTimeout(timer)
  }, [search])

  const { data, isLoading } = useQuery({
    queryKey: ["product-stories", q, status, storefront, page],
    queryFn: () => {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(page * PAGE_SIZE),
      })
      if (q) {
        params.set("q", q)
      }
      if (status !== "all") {
        params.set("status", status)
      }
      if (storefront !== ALL_STOREFRONTS) {
        params.set("storefront_key", storefront)
      }
      return sdk.client.fetch<{
        product_stories: ProductStory[]
        count: number
      }>(`/admin/product-stories?${params.toString()}`)
    },
  })

  const stories = data?.product_stories ?? []
  const count = data?.count ?? 0
  const pageCount = Math.max(1, Math.ceil(count / PAGE_SIZE))

  return (
    <Container className="divide-y p-0">
      <div className="flex flex-col gap-y-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Heading>Product Stories</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Satu cerita per produk. Cerita jadi halaman yang menautkan semua
            model produk tersebut, dan muncul di halaman produknya.
          </Text>
        </div>
        <Button size="small" onClick={() => navigate("/content/product-stories/new")}>
          <Plus />
          Cerita baru
        </Button>
      </div>

      <div className="flex flex-col gap-2 px-6 py-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <span className="text-ui-fg-muted pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2">
            <MagnifyingGlass />
          </span>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari judul, handle, atau nama produk..."
            className="pl-8"
          />
        </div>
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value)
            setPage(0)
          }}
        >
          <Select.Trigger className="md:w-40">
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="all">Semua status</Select.Item>
            <Select.Item value="published">Terbit</Select.Item>
            <Select.Item value="draft">Draf</Select.Item>
          </Select.Content>
        </Select>
        <Select
          value={storefront}
          onValueChange={(value) => {
            setStorefront(value)
            setPage(0)
          }}
        >
          <Select.Trigger className="md:w-48">
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value={ALL_STOREFRONTS}>Semua storefront</Select.Item>
            {storefronts.map((option) => (
              <Select.Item key={option.key} value={option.key}>
                {option.name}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
      </div>

      {isLoading && (
        <div className="px-6 py-10 text-center">
          <Text size="small" className="text-ui-fg-muted">
            Memuat...
          </Text>
        </div>
      )}

      {!isLoading && stories.length === 0 && (
        <div className="flex flex-col items-center gap-y-2 px-6 py-12 text-center">
          <Text weight="plus">Belum ada cerita produk</Text>
          <Text size="small" className="text-ui-fg-subtle max-w-sm">
            Cerita produk menjelaskan satu keluarga produk sekaligus - misalnya
            semua sepatu bola sol FG - dan menautkan semuanya dari satu halaman.
          </Text>
          <Button
            size="small"
            variant="secondary"
            onClick={() => navigate("/content/product-stories/new")}
          >
            Buat cerita pertama
          </Button>
        </div>
      )}

      {stories.length > 0 && (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Cerita</Table.HeaderCell>
              <Table.HeaderCell>Produk</Table.HeaderCell>
              <Table.HeaderCell>Tertaut</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Diperbarui</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {stories.map((story) => (
              <Table.Row
                key={story.id}
                className="cursor-pointer"
                onClick={() => navigate(`/content/product-stories/${story.id}`)}
              >
                <Table.Cell>
                  <div className="flex flex-col">
                    <Text size="small" weight="plus" className="line-clamp-1">
                      {story.title}
                    </Text>
                    <Text size="xsmall" className="text-ui-fg-muted">
                      /stories/{story.handle}
                    </Text>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <Badge size="2xsmall">{story.product_name}</Badge>
                </Table.Cell>
                <Table.Cell>
                  <Text size="small" className="text-ui-fg-subtle">
                    {story.product_handles?.length ?? 0} produk
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <PublishBadge status={story.status} />
                </Table.Cell>
                <Table.Cell>
                  <Text size="small" className="text-ui-fg-subtle">
                    {formatDate(story.updated_at)}
                  </Text>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}

      <Table.Pagination
        count={count}
        pageSize={PAGE_SIZE}
        pageIndex={page}
        pageCount={pageCount}
        canPreviousPage={page > 0}
        canNextPage={page + 1 < pageCount}
        previousPage={() => setPage((current) => Math.max(0, current - 1))}
        nextPage={() => setPage((current) => current + 1)}
        translations={{
          of: "dari",
          results: "hasil",
          pages: "halaman",
          prev: "Sebelumnya",
          next: "Berikutnya",
        }}
      />
    </Container>
  )
}

// Listed under Content in the sidebar (nested by folder).
export const config = defineRouteConfig({
  label: "Product Stories",
  rank: 2,
})

export default ProductStoriesPage
