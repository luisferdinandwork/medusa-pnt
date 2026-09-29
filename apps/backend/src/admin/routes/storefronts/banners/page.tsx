import { defineRouteConfig } from "@medusajs/admin-sdk"
import {
  ArrowLeftMini,
  ArrowRightMini,
  EyeMini,
  EyeSlashMini,
  PencilSquare,
  Plus,
  SquareTwoStack,
  Trash,
} from "@medusajs/icons"
import {
  Button,
  Checkbox,
  Container,
  Heading,
  IconButton,
  Label,
  Prompt,
  Select,
  StatusBadge,
  Text,
  toast,
  Tooltip,
} from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useSearchParams } from "react-router-dom"
import { BannerEditor, type EditorTarget } from "../../../components/banners/banner-editor"
import { BannerPreview } from "../../../components/banners/banner-preview"
import { describeLink } from "../../../components/banners/link-picker"
import {
  type Banner,
  type BannerPlacement,
  bannersQueryKey,
  bannerStatus,
  PLACEMENT_ORDER,
  PLACEMENTS,
  STATUS_COLOR,
  STATUS_LABEL,
} from "../../../components/banners/types"
import type { StorefrontOption } from "../../../components/content/types"
import { sdk } from "../../../lib/sdk"

const formatWhen = (value: string) =>
  new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })

const scheduleText = (banner: Banner) => {
  const status = bannerStatus(banner)
  if (status === "scheduled" && banner.starts_at) {
    return `from ${formatWhen(banner.starts_at)}`
  }
  if (status === "ended" && banner.ends_at) {
    return `ended ${formatWhen(banner.ends_at)}`
  }
  if (banner.ends_at) {
    return `until ${formatWhen(banner.ends_at)}`
  }
  return null
}

// What the storefront does when a section has no live banner.
const EMPTY_FALLBACK: Record<BannerPlacement, string> = {
  hero: "No slides: the homepage falls back to the text hero from the storefront settings.",
  category: "No tiles: the homepage shows plain text links to the top categories.",
  promo: "No promos: the section is left out.",
  feature: "No feature banner: the section is left out.",
}

const BannerCard = ({
  banner,
  isFirst,
  isLast,
  busy,
  onMove,
  onEdit,
  onToggle,
  onDelete,
}: {
  banner: Banner
  isFirst: boolean
  isLast: boolean
  busy: boolean
  onMove: (step: -1 | 1) => void
  onEdit: () => void
  onToggle: () => void
  onDelete: () => void
}) => {
  const status = bannerStatus(banner)
  const schedule = scheduleText(banner)

  return (
    <div className="bg-ui-bg-base border-ui-border-base flex flex-col overflow-hidden rounded-lg border">
      <button
        type="button"
        onClick={onEdit}
        className="focus-visible:shadow-borders-focus group relative block outline-none"
        aria-label="Edit banner"
      >
        <BannerPreview
          banner={banner}
          compact
          className={status === "live" ? "rounded-none" : "rounded-none opacity-60 transition-opacity group-hover:opacity-100"}
        />
      </button>
      <div className="flex flex-col gap-y-2 p-3">
        <div className="flex items-center justify-between gap-x-2">
          <div className="flex min-w-0 items-center gap-x-2">
            <StatusBadge color={STATUS_COLOR[status]}>{STATUS_LABEL[status]}</StatusBadge>
            {schedule && (
              <Text size="xsmall" className="text-ui-fg-subtle truncate">
                {schedule}
              </Text>
            )}
          </div>
          <div className="flex shrink-0 items-center">
            <Tooltip content="Move earlier">
              <IconButton size="small" variant="transparent" disabled={busy || isFirst} onClick={() => onMove(-1)}>
                <ArrowLeftMini />
              </IconButton>
            </Tooltip>
            <Tooltip content="Move later">
              <IconButton size="small" variant="transparent" disabled={busy || isLast} onClick={() => onMove(1)}>
                <ArrowRightMini />
              </IconButton>
            </Tooltip>
            <Tooltip content={banner.is_active ? "Hide" : "Show"}>
              <IconButton size="small" variant="transparent" disabled={busy} onClick={onToggle}>
                {banner.is_active ? <EyeMini /> : <EyeSlashMini />}
              </IconButton>
            </Tooltip>
            <Tooltip content="Edit">
              <IconButton size="small" variant="transparent" onClick={onEdit}>
                <PencilSquare />
              </IconButton>
            </Tooltip>
            <Prompt>
              <Prompt.Trigger asChild>
                <IconButton size="small" variant="transparent" disabled={busy} aria-label="Delete">
                  <Trash />
                </IconButton>
              </Prompt.Trigger>
              <Prompt.Content>
                <Prompt.Header>
                  <Prompt.Title>Delete this banner?</Prompt.Title>
                  <Prompt.Description>
                    It disappears from the homepage. The uploaded images stay in the file storage.
                  </Prompt.Description>
                </Prompt.Header>
                <Prompt.Footer>
                  <Prompt.Cancel>Cancel</Prompt.Cancel>
                  <Prompt.Action onClick={onDelete}>Delete</Prompt.Action>
                </Prompt.Footer>
              </Prompt.Content>
            </Prompt>
          </div>
        </div>
        <Text size="small" weight="plus" className="truncate">
          {banner.title || banner.image_alt || "Untitled image"}
        </Text>
        <Text size="xsmall" className="text-ui-fg-muted truncate">
          Links to {describeLink(banner.link_type, banner.link_value)}
        </Text>
      </div>
    </div>
  )
}

const CopyBannersPrompt = ({
  storefronts,
  target,
  targetHasBanners,
}: {
  storefronts: StorefrontOption[]
  target: StorefrontOption
  targetHasBanners: boolean
}) => {
  const queryClient = useQueryClient()
  const sources = storefronts.filter((s) => s.key !== target.key)
  const [from, setFrom] = useState(sources[0]?.key ?? "")
  const [replace, setReplace] = useState(false)

  const copy = useMutation({
    mutationFn: () =>
      sdk.client.fetch<{ count: number }>("/admin/banners/copy", {
        method: "POST",
        body: { from_storefront_key: from, to_storefront_key: target.key, replace },
      }),
    onSuccess: ({ count }) => {
      queryClient.invalidateQueries({ queryKey: bannersQueryKey(target.key) })
      toast.success(`Copied ${count} banner(s) to ${target.name}`)
    },
    onError: (error: Error) => toast.error("Could not copy banners", { description: error.message }),
  })

  if (!sources.length) {
    return null
  }

  return (
    <Prompt variant="confirmation">
      <Prompt.Trigger asChild>
        <Button size="small" variant="secondary" className="shrink-0 whitespace-nowrap">
          <SquareTwoStack />
          Copy from...
        </Button>
      </Prompt.Trigger>
      <Prompt.Content>
        <Prompt.Header>
          <Prompt.Title>Copy banners to {target.name}</Prompt.Title>
          <Prompt.Description>
            Every banner of the chosen storefront is copied, with the same images and links. Edit
            them afterwards to fit this storefront.
          </Prompt.Description>
        </Prompt.Header>
        <div className="flex flex-col gap-y-4 px-6 pb-4">
          <Select value={from} onValueChange={setFrom}>
            <Select.Trigger>
              <Select.Value placeholder="Copy from" />
            </Select.Trigger>
            <Select.Content>
              {sources.map((source) => (
                <Select.Item key={source.key} value={source.key}>
                  {source.name}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
          {targetHasBanners && (
            <div className="flex items-center gap-x-2">
              <Checkbox
                id="copy-replace"
                checked={replace}
                onCheckedChange={(checked) => setReplace(checked === true)}
              />
              <Label htmlFor="copy-replace" size="small">
                Replace the banners {target.name} has now
              </Label>
            </div>
          )}
        </div>
        <Prompt.Footer>
          <Prompt.Cancel>Cancel</Prompt.Cancel>
          <Prompt.Action onClick={() => copy.mutate()} disabled={!from}>
            Copy
          </Prompt.Action>
        </Prompt.Footer>
      </Prompt.Content>
    </Prompt>
  )
}

const BannersPage = () => {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [editor, setEditor] = useState<EditorTarget | null>(null)

  const { data: storefrontData, isLoading: loadingStorefronts } = useQuery({
    queryKey: ["storefronts"],
    queryFn: () => sdk.client.fetch<{ storefronts: StorefrontOption[] }>("/admin/storefronts"),
  })
  const storefronts = storefrontData?.storefronts ?? []
  const storefront =
    storefronts.find((s) => s.key === searchParams.get("storefront")) ?? storefronts[0]
  const storefrontKey = storefront?.key ?? ""

  const queryKey = bannersQueryKey(storefrontKey)
  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      sdk.client.fetch<{ banners: Banner[] }>("/admin/banners", {
        query: { storefront_key: storefrontKey },
      }),
    enabled: !!storefrontKey,
  })
  const banners = data?.banners ?? []
  const byPlacement = (placement: BannerPlacement) =>
    banners.filter((banner) => banner.placement === placement).sort((a, b) => a.rank - b.rank)

  const onError = (error: Error) => toast.error("Could not update the banner", { description: error.message })

  const reorder = useMutation({
    mutationFn: (ids: string[]) =>
      sdk.client.fetch("/admin/banners/reorder", { method: "POST", body: { ids } }),
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<{ banners: Banner[] }>(queryKey)
      const rank = new Map(ids.map((id, index) => [id, index]))
      queryClient.setQueryData<{ banners: Banner[] }>(queryKey, (current) =>
        current && {
          banners: current.banners.map((banner) =>
            rank.has(banner.id) ? { ...banner, rank: rank.get(banner.id)! } : banner
          ),
        }
      )
      return { previous }
    },
    onError: (error: Error, _ids, context) => {
      queryClient.setQueryData(queryKey, context?.previous)
      onError(error)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  })

  const toggle = useMutation({
    mutationFn: (banner: Banner) =>
      sdk.client.fetch(`/admin/banners/${banner.id}`, {
        method: "POST",
        body: { is_active: !banner.is_active },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError,
  })

  const remove = useMutation({
    mutationFn: (banner: Banner) =>
      sdk.client.fetch(`/admin/banners/${banner.id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      toast.success("Banner deleted")
    },
    onError,
  })

  const move = (list: Banner[], index: number, step: -1 | 1) => {
    const ids = list.map((banner) => banner.id)
    const [id] = ids.splice(index, 1)
    ids.splice(index + step, 0, id)
    reorder.mutate(ids)
  }

  const busy = reorder.isPending || toggle.isPending || remove.isPending

  if (!loadingStorefronts && !storefronts.length) {
    return (
      <Container className="px-6 py-8">
        <Heading>Banners</Heading>
        <Text size="small" className="text-ui-fg-subtle mt-2">
          No storefronts yet. Create one under Storefronts first; banners are managed per
          storefront.
        </Text>
      </Container>
    )
  }

  return (
    <div className="flex flex-col gap-y-3">
      <Container className="flex flex-col gap-y-4 px-6 py-4">
        <div className="flex flex-col gap-y-3 md:flex-row md:items-start md:justify-between">
          <div className="max-w-2xl">
            <Heading>Banners</Heading>
            <Text size="small" className="text-ui-fg-subtle">
              The images on each storefront&apos;s homepage. Every image links into the shop - a
              category, a collection or a product - so it works as a button. Changes show up on
              the storefront within a minute.
            </Text>
          </div>
          <div className="flex shrink-0 items-center gap-x-2">
            {storefront && (
              <CopyBannersPrompt
                key={storefront.key}
                storefronts={storefronts}
                target={storefront}
                targetHasBanners={banners.length > 0}
              />
            )}
            <div className="w-56">
              <Select
                value={storefrontKey || undefined}
                onValueChange={(value) => setSearchParams({ storefront: value })}
              >
                <Select.Trigger>
                  <Select.Value placeholder={loadingStorefronts ? "Loading..." : "Storefront"} />
                </Select.Trigger>
                <Select.Content>
                  {storefronts.map((s) => (
                    <Select.Item key={s.key} value={s.key}>
                      {s.name}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>
          </div>
        </div>

        <ol className="text-ui-fg-subtle txt-compact-xsmall flex flex-wrap items-center gap-x-2 gap-y-1">
          <li className="text-ui-fg-muted">Homepage order:</li>
          {[
            PLACEMENTS.hero.label,
            PLACEMENTS.category.label,
            "New arrivals (automatic)",
            PLACEMENTS.promo.label,
            PLACEMENTS.feature.label,
            "Story, guides & articles",
          ].map((label, index) => (
            <li key={label} className="flex items-center gap-x-2">
              {index > 0 && <span className="text-ui-fg-muted">/</span>}
              <span>{label}</span>
            </li>
          ))}
        </ol>
      </Container>

      {PLACEMENT_ORDER.map((placement) => {
        const info = PLACEMENTS[placement]
        const list = byPlacement(placement)
        const live = list.filter((banner) => bannerStatus(banner) === "live").length

        return (
          <Container key={placement} className="divide-y p-0">
            <div className="flex flex-col gap-y-3 px-6 py-4 md:flex-row md:items-start md:justify-between">
              <div className="max-w-2xl">
                <div className="flex items-center gap-x-2">
                  <Heading level="h2">{info.label}</Heading>
                  <Text size="xsmall" className="text-ui-fg-muted">
                    {list.length ? `${live} of ${list.length} live` : "empty"}
                  </Text>
                </div>
                <Text size="small" className="text-ui-fg-subtle">
                  {info.description}
                </Text>
                <Text size="xsmall" className="text-ui-fg-muted mt-1">
                  Image {info.size}
                  {info.mobileSize ? `, phone image ${info.mobileSize}` : ""}.
                </Text>
              </div>
              <Button
                size="small"
                variant="secondary"
                className="shrink-0 whitespace-nowrap"
                disabled={!storefrontKey}
                onClick={() => setEditor({ mode: "create", placement })}
              >
                <Plus />
                Add {info.noun}
              </Button>
            </div>
            <div className="px-6 py-4">
              {isLoading ? (
                <Text size="small" className="text-ui-fg-muted">Loading...</Text>
              ) : list.length ? (
                <div className={`grid gap-3 ${info.grid}`}>
                  {list.map((banner, index) => (
                    <BannerCard
                      key={banner.id}
                      banner={banner}
                      isFirst={index === 0}
                      isLast={index === list.length - 1}
                      busy={busy}
                      onMove={(step) => move(list, index, step)}
                      onEdit={() => setEditor({ mode: "edit", banner })}
                      onToggle={() => toggle.mutate(banner)}
                      onDelete={() => remove.mutate(banner)}
                    />
                  ))}
                </div>
              ) : (
                <Text size="small" className="text-ui-fg-muted">
                  {EMPTY_FALLBACK[placement]}
                </Text>
              )}
            </div>
          </Container>
        )
      })}

      {editor && storefront && (
        <BannerEditor
          key={editor.mode === "edit" ? editor.banner.id : `new-${editor.placement}`}
          storefrontKey={storefront.key}
          storefrontName={storefront.name}
          target={editor}
          onClose={() => setEditor(null)}
        />
      )}
    </div>
  )
}

// Listed under Storefronts in the sidebar (nested by folder).
export const config = defineRouteConfig({
  label: "Banners",
  rank: 0,
})

export default BannersPage
