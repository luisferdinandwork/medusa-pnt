import { defineRouteConfig } from "@medusajs/admin-sdk"
import { BuildingStorefront } from "@medusajs/icons"
import {
  Badge,
  Button,
  Container,
  Drawer,
  Heading,
  Input,
  Label,
  Select,
  Table,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { sdk } from "../../lib/sdk"

type Storefront = {
  id: string
  key: string
  name: string
  short_name: string
  tagline: string | null
  default_title: string | null
  default_description: string | null
  announcement_items: string[] | null
  hero_eyebrow: string | null
  hero_heading: string | null
  hero_body: string | null
  hero_price: string | null
  hero_compare_price: string | null
  hero_badge: string | null
  hero_cta_label: string | null
  sales_channel?: { id: string; name: string } | null
}

type FormValues = {
  key: string
  sales_channel_id: string
  name: string
  short_name: string
  tagline: string
  default_title: string
  default_description: string
  announcement: string
  hero_eyebrow: string
  hero_heading: string
  hero_body: string
  hero_price: string
  hero_compare_price: string
  hero_badge: string
  hero_cta_label: string
}

const EMPTY_FORM: FormValues = {
  key: "",
  sales_channel_id: "",
  name: "",
  short_name: "",
  tagline: "",
  default_title: "",
  default_description: "",
  announcement: "",
  hero_eyebrow: "",
  hero_heading: "",
  hero_body: "",
  hero_price: "",
  hero_compare_price: "",
  hero_badge: "",
  hero_cta_label: "",
}

const toForm = (s: Storefront): FormValues => ({
  key: s.key,
  sales_channel_id: s.sales_channel?.id ?? "",
  name: s.name,
  short_name: s.short_name,
  tagline: s.tagline ?? "",
  default_title: s.default_title ?? "",
  default_description: s.default_description ?? "",
  announcement: (s.announcement_items ?? []).join("\n"),
  hero_eyebrow: s.hero_eyebrow ?? "",
  hero_heading: s.hero_heading ?? "",
  hero_body: s.hero_body ?? "",
  hero_price: s.hero_price ?? "",
  hero_compare_price: s.hero_compare_price ?? "",
  hero_badge: s.hero_badge ?? "",
  hero_cta_label: s.hero_cta_label ?? "",
})

const blankToNull = (value: string) => (value.trim() === "" ? null : value.trim())

const toPayload = (form: FormValues) => ({
  name: form.name.trim(),
  short_name: form.short_name.trim(),
  tagline: blankToNull(form.tagline),
  default_title: blankToNull(form.default_title),
  default_description: blankToNull(form.default_description),
  announcement_items: form.announcement
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean),
  hero_eyebrow: blankToNull(form.hero_eyebrow),
  hero_heading: blankToNull(form.hero_heading),
  hero_body: blankToNull(form.hero_body),
  hero_price: blankToNull(form.hero_price),
  hero_compare_price: blankToNull(form.hero_compare_price),
  hero_badge: blankToNull(form.hero_badge),
  hero_cta_label: blankToNull(form.hero_cta_label),
})

const Field = ({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) => (
  <div className="flex flex-col gap-y-1">
    <Label size="small" weight="plus">
      {label}
    </Label>
    {children}
    {hint && (
      <Text size="small" className="text-ui-fg-subtle">
        {hint}
      </Text>
    )}
  </div>
)

const StorefrontDrawer = ({
  storefront,
  open,
  onOpenChange,
}: {
  storefront: Storefront | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) => {
  const queryClient = useQueryClient()
  const isEdit = storefront !== null
  const [form, setForm] = useState<FormValues>(
    storefront ? toForm(storefront) : EMPTY_FORM
  )
  const set = (field: keyof FormValues) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((current) => ({ ...current, [field]: event.target.value }))

  const { data: channelData } = useQuery({
    queryKey: ["sales-channels-for-storefronts"],
    queryFn: () => sdk.admin.salesChannel.list({ limit: 100 }),
    enabled: !isEdit,
  })
  const { data: storefrontData } = useQuery({
    queryKey: ["storefronts"],
    queryFn: () =>
      sdk.client.fetch<{ storefronts: Storefront[] }>("/admin/storefronts"),
    enabled: !isEdit,
  })
  const usedChannelIds = new Set(
    (storefrontData?.storefronts ?? []).map((s) => s.sales_channel?.id)
  )
  const freeChannels = (channelData?.sales_channels ?? []).filter(
    (channel) => !usedChannelIds.has(channel.id)
  )

  const save = useMutation({
    mutationFn: () =>
      isEdit
        ? sdk.client.fetch(`/admin/storefronts/${storefront.id}`, {
            method: "POST",
            body: toPayload(form),
          })
        : sdk.client.fetch("/admin/storefronts", {
            method: "POST",
            body: {
              key: form.key.trim(),
              sales_channel_id: form.sales_channel_id,
              ...toPayload(form),
            },
          }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storefronts"] })
      toast.success(isEdit ? "Storefront updated" : "Storefront created", {
        description: "The storefront picks up the change within a minute.",
      })
      onOpenChange(false)
    },
    onError: (error: Error) => toast.error("Could not save", { description: error.message }),
  })

  const canSave =
    form.name.trim() !== "" &&
    form.short_name.trim() !== "" &&
    (isEdit || (form.key.trim() !== "" && form.sales_channel_id !== ""))

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>{isEdit ? `Edit ${storefront.name}` : "New storefront"}</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body className="flex flex-col gap-y-6 overflow-y-auto">
          {!isEdit && (
            <>
              <Field label="Key" hint="Lowercase slug, e.g. specs-b2b. Cannot be changed later.">
                <Input value={form.key} onChange={set("key")} placeholder="specs-outlet" />
              </Field>
              <Field
                label="Sales channel"
                hint="The storefront uses the publishable API key of this sales channel."
              >
                <Select
                  value={form.sales_channel_id}
                  onValueChange={(value) => setForm((c) => ({ ...c, sales_channel_id: value }))}
                >
                  <Select.Trigger>
                    <Select.Value placeholder="Select a sales channel" />
                  </Select.Trigger>
                  <Select.Content>
                    {freeChannels.map((channel) => (
                      <Select.Item key={channel.id} value={channel.id}>
                        {channel.name}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
              </Field>
            </>
          )}

          <Heading level="h3">General</Heading>
          <Field label="Name">
            <Input value={form.name} onChange={set("name")} />
          </Field>
          <Field label="Short name" hint="Shown in the header, footer and page titles.">
            <Input value={form.short_name} onChange={set("short_name")} />
          </Field>
          <Field label="Tagline">
            <Input value={form.tagline} onChange={set("tagline")} />
          </Field>
          <Field label="Homepage title">
            <Input value={form.default_title} onChange={set("default_title")} />
          </Field>
          <Field label="Homepage description">
            <Textarea value={form.default_description} onChange={set("default_description")} rows={2} />
          </Field>

          <Heading level="h3">Announcement bar</Heading>
          <Field label="Messages" hint="One message per line (up to 8). Leave empty to hide the bar.">
            <Textarea value={form.announcement} onChange={set("announcement")} rows={4} />
          </Field>

          <Heading level="h3">Homepage hero (text fallback)</Heading>
          <Text size="small" className="text-ui-fg-subtle -mt-4">
            Shown only while the storefront has no live hero slides under Storefronts &gt; Banners.
            Leave the heading empty to hide it.
          </Text>
          <Field label="Eyebrow">
            <Input value={form.hero_eyebrow} onChange={set("hero_eyebrow")} />
          </Field>
          <Field
            label="Heading"
            hint="A new line breaks the heading. Wrap words in *asterisks* to color them."
          >
            <Textarea value={form.hero_heading} onChange={set("hero_heading")} rows={2} />
          </Field>
          <Field label="Body">
            <Textarea value={form.hero_body} onChange={set("hero_body")} rows={3} />
          </Field>
          <div className="grid grid-cols-3 gap-x-3">
            <Field label="Price">
              <Input value={form.hero_price} onChange={set("hero_price")} />
            </Field>
            <Field label="Compare-at price">
              <Input value={form.hero_compare_price} onChange={set("hero_compare_price")} />
            </Field>
            <Field label="Badge">
              <Input value={form.hero_badge} onChange={set("hero_badge")} />
            </Field>
          </div>
          <Field label="Button label">
            <Input value={form.hero_cta_label} onChange={set("hero_cta_label")} />
          </Field>
        </Drawer.Body>
        <Drawer.Footer>
          <Drawer.Close asChild>
            <Button variant="secondary">Cancel</Button>
          </Drawer.Close>
          <Button onClick={() => save.mutate()} isLoading={save.isPending} disabled={!canSave}>
            Save
          </Button>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  )
}

const StorefrontsPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["storefronts"],
    queryFn: () =>
      sdk.client.fetch<{ storefronts: Storefront[] }>("/admin/storefronts"),
  })
  // `editing`: a storefront to edit, "new" to create, null when closed.
  const [editing, setEditing] = useState<Storefront | "new" | null>(null)

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading>Storefronts</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Branding and homepage copy for each shop front. Products, orders and stock are managed
            per sales channel in their usual pages.
          </Text>
        </div>
        <Button size="small" variant="secondary" onClick={() => setEditing("new")}>
          Create
        </Button>
      </div>

      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Name</Table.HeaderCell>
            <Table.HeaderCell>Key</Table.HeaderCell>
            <Table.HeaderCell>Sales channel</Table.HeaderCell>
            <Table.HeaderCell>Announcement</Table.HeaderCell>
            <Table.HeaderCell />
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {isLoading && (
            <Table.Row>
              <Table.Cell>Loading...</Table.Cell>
            </Table.Row>
          )}
          {data?.storefronts.map((storefront) => (
            <Table.Row key={storefront.id} className="[&_td:last-child]:w-[1%] [&_td:last-child]:whitespace-nowrap">
              <Table.Cell>{storefront.name}</Table.Cell>
              <Table.Cell>
                <code>{storefront.key}</code>
              </Table.Cell>
              <Table.Cell>
                {storefront.sales_channel ? (
                  <Badge size="2xsmall">{storefront.sales_channel.name}</Badge>
                ) : (
                  <Text size="small" className="text-ui-fg-muted">Not linked</Text>
                )}
              </Table.Cell>
              <Table.Cell>
                {storefront.announcement_items?.length
                  ? `${storefront.announcement_items.length} message(s)`
                  : "Hidden"}
              </Table.Cell>
              <Table.Cell>
                <Button size="small" variant="transparent" onClick={() => setEditing(storefront)}>
                  Edit
                </Button>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>

      {editing !== null && (
        <StorefrontDrawer
          // Remount per target so the form starts from that storefront's values.
          key={editing === "new" ? "new" : editing.id}
          storefront={editing === "new" ? null : editing}
          open
          onOpenChange={(open) => !open && setEditing(null)}
        />
      )}
    </Container>
  )
}

// Parent of the storefront design pages (Homepage) in the sidebar.
export const config = defineRouteConfig({
  label: "Storefronts",
  icon: BuildingStorefront,
  rank: 100,
})

export default StorefrontsPage
