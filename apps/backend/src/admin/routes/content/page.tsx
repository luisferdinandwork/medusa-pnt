import { defineRouteConfig } from "@medusajs/admin-sdk"
import { BookOpen, Newspaper, Plus } from "@medusajs/icons"
import { Badge, Button, Container, Heading, Table, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import type { ComponentType } from "react"
import { useNavigate } from "react-router-dom"
import type { Article, ProductStory } from "../../components/content/types"
import { formatDate, PublishBadge } from "../../components/content/ui"
import { sdk } from "../../lib/sdk"

const RECENT_LIMIT = 5

type Summary<T> = { recent: T[]; total: number; published: number }

// One list call for the newest rows plus the total, one for the published
// count. Draft is the difference, so no third request is needed.
const fetchSummary = async <T,>(
  path: string,
  key: string
): Promise<Summary<T>> => {
  const [recent, published] = await Promise.all([
    sdk.client.fetch<Record<string, unknown> & { count: number }>(
      `${path}?limit=${RECENT_LIMIT}&order=-updated_at`
    ),
    sdk.client.fetch<{ count: number }>(`${path}?limit=1&status=published`),
  ])
  return {
    recent: (recent[key] as T[]) ?? [],
    total: recent.count,
    published: published.count,
  }
}

const SummaryCard = ({
  icon: Icon,
  title,
  description,
  summary,
  isLoading,
  listPath,
  newLabel,
}: {
  icon: ComponentType
  title: string
  description: string
  summary?: Summary<unknown>
  isLoading: boolean
  listPath: string
  newLabel: string
}) => {
  const navigate = useNavigate()
  const total = summary?.total ?? 0
  const published = summary?.published ?? 0

  return (
    <div className="bg-ui-bg-base shadow-elevation-card-rest flex flex-col justify-between gap-y-4 rounded-lg p-6">
      <div className="flex flex-col gap-y-2">
        <div className="text-ui-fg-subtle flex items-center gap-x-2">
          <Icon />
          <Heading level="h2">{title}</Heading>
        </div>
        <Text size="small" className="text-ui-fg-subtle">
          {description}
        </Text>
      </div>
      <div className="flex items-center gap-x-2">
        {isLoading ? (
          <Text size="small" className="text-ui-fg-muted">
            Loading...
          </Text>
        ) : (
          <>
            <Badge size="2xsmall" color="green">
              {published} published
            </Badge>
            <Badge size="2xsmall">{total - published} draft</Badge>
          </>
        )}
      </div>
      <div className="flex items-center gap-x-2">
        <Button
          size="small"
          variant="secondary"
          onClick={() => navigate(listPath)}
        >
          View all
        </Button>
        <Button
          size="small"
          variant="transparent"
          onClick={() => navigate(`${listPath}/new`)}
        >
          <Plus />
          {newLabel}
        </Button>
      </div>
    </div>
  )
}

type RecentRow = {
  id: string
  type: "Article" | "Product Story"
  title: string
  status: string
  updated_at: string
  href: string
}

const ContentPage = () => {
  const navigate = useNavigate()

  const articles = useQuery({
    queryKey: ["articles", "summary"],
    queryFn: () => fetchSummary<Article>("/admin/articles", "articles"),
  })
  const stories = useQuery({
    queryKey: ["product-stories", "summary"],
    queryFn: () =>
      fetchSummary<ProductStory>("/admin/product-stories", "product_stories"),
  })

  const recent: RecentRow[] = [
    ...(articles.data?.recent ?? []).map((article) => ({
      id: article.id,
      type: "Article" as const,
      title: article.title,
      status: article.status,
      updated_at: article.updated_at,
      href: `/content/articles/${article.id}`,
    })),
    ...(stories.data?.recent ?? []).map((story) => ({
      id: story.id,
      type: "Product Story" as const,
      title: story.title,
      status: story.status,
      updated_at: story.updated_at,
      href: `/content/product-stories/${story.id}`,
    })),
  ]
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .slice(0, RECENT_LIMIT)

  return (
    <div className="flex flex-col gap-y-3">
      <Container className="px-6 py-4">
        <Heading>Content</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Articles and product stories published to the storefronts. Only
          published entries are visible to shoppers.
        </Text>
      </Container>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <SummaryCard
          icon={Newspaper}
          title="Articles"
          description="Guides and editorial posts with the SEO and answer-engine fields."
          summary={articles.data}
          isLoading={articles.isLoading}
          listPath="/content/articles"
          newLabel="New article"
        />
        <SummaryCard
          icon={BookOpen}
          title="Product Stories"
          description="One page per product that links its models together and shows on their product pages."
          summary={stories.data}
          isLoading={stories.isLoading}
          listPath="/content/product-stories"
          newLabel="New story"
        />
      </div>

      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading level="h2">Recently updated</Heading>
        </div>
        {recent.length === 0 ? (
          <div className="px-6 py-8">
            <Text size="small" className="text-ui-fg-muted">
              {articles.isLoading || stories.isLoading
                ? "Loading..."
                : "Nothing yet. Create an article or a product story to get started."}
            </Text>
          </div>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Title</Table.HeaderCell>
                <Table.HeaderCell>Type</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell>Updated</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {recent.map((row) => (
                <Table.Row
                  key={row.id}
                  className="cursor-pointer"
                  onClick={() => navigate(row.href)}
                >
                  <Table.Cell>
                    <Text size="small" weight="plus" className="line-clamp-1">
                      {row.title}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="small" className="text-ui-fg-subtle">
                      {row.type}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <PublishBadge status={row.status} />
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="small" className="text-ui-fg-subtle">
                      {formatDate(row.updated_at)}
                    </Text>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </Container>
    </div>
  )
}

// Parent of Articles and Product Stories in the sidebar, the same way
// Products holds Collections and Categories.
export const config = defineRouteConfig({
  label: "Content",
  icon: Newspaper,
  rank: 101,
})

export default ContentPage
