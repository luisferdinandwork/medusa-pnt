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
import { ALL_STOREFRONTS, type Article } from "../../../components/content/types"
import { formatDate, PublishBadge } from "../../../components/content/ui"
import { useStorefronts } from "../../../components/content/use-storefronts"
import { sdk } from "../../../lib/sdk"

const PAGE_SIZE = 20

const ArticlesPage = () => {
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
    queryKey: ["articles", q, status, storefront, page],
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
      return sdk.client.fetch<{ articles: Article[]; count: number }>(
        `/admin/articles?${params.toString()}`
      )
    },
  })

  const articles = data?.articles ?? []
  const count = data?.count ?? 0
  const pageCount = Math.max(1, Math.ceil(count / PAGE_SIZE))

  return (
    <Container className="divide-y p-0">
      <div className="flex flex-col gap-y-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Heading>Articles</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Konten editorial untuk SEO dan GEO. Setiap artikel membawa ringkasan
            jawaban, poin kunci, dan FAQ yang dibaca mesin pencari serta asisten
            AI.
          </Text>
        </div>
        <Button size="small" onClick={() => navigate("/content/articles/new")}>
          <Plus />
          Artikel baru
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
            placeholder="Cari judul, handle, atau kategori..."
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

      {!isLoading && articles.length === 0 && (
        <div className="flex flex-col items-center gap-y-2 px-6 py-12 text-center">
          <Text weight="plus">Belum ada artikel</Text>
          <Text size="small" className="text-ui-fg-subtle max-w-sm">
            Artikel yang terbit muncul di halaman /blog storefront dan membawa
            data terstruktur untuk mesin pencari.
          </Text>
          <Button
            size="small"
            variant="secondary"
            onClick={() => navigate("/content/articles/new")}
          >
            Buat artikel pertama
          </Button>
        </div>
      )}

      {articles.length > 0 && (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Judul</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Kategori</Table.HeaderCell>
              <Table.HeaderCell>Storefront</Table.HeaderCell>
              <Table.HeaderCell>Diperbarui</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {articles.map((article) => (
              <Table.Row
                key={article.id}
                className="cursor-pointer"
                onClick={() => navigate(`/content/articles/${article.id}`)}
              >
                <Table.Cell>
                  <div className="flex flex-col">
                    <Text size="small" weight="plus" className="line-clamp-1">
                      {article.title}
                    </Text>
                    <Text size="xsmall" className="text-ui-fg-muted">
                      /blog/{article.handle}
                    </Text>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <div className="flex items-center gap-x-1.5">
                    <PublishBadge status={article.status} />
                    {article.is_featured && (
                      <Badge size="2xsmall" color="orange">
                        Unggulan
                      </Badge>
                    )}
                  </div>
                </Table.Cell>
                <Table.Cell>
                  {article.category ? (
                    <Badge size="2xsmall">{article.category}</Badge>
                  ) : (
                    <Text size="small" className="text-ui-fg-muted">
                      -
                    </Text>
                  )}
                </Table.Cell>
                <Table.Cell>
                  <Text size="small" className="text-ui-fg-subtle">
                    {article.storefront_key ?? "Semua"}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <Text size="small" className="text-ui-fg-subtle">
                    {formatDate(article.updated_at)}
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
  label: "Articles",
  rank: 1,
})

export default ArticlesPage
