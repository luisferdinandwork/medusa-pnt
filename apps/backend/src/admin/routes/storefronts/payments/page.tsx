import { defineRouteConfig } from "@medusajs/admin-sdk"
import { EllipsisHorizontal, PencilSquare, Plus, Trash } from "@medusajs/icons"
import {
  Alert,
  Badge,
  Button,
  Container,
  DropdownMenu,
  Heading,
  IconButton,
  Prompt,
  StatusBadge,
  Switch,
  Table,
  Text,
  toast,
} from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { GatewayEditor, type GatewayEditorTarget } from "../../../components/payments/gateway-editor"
import {
  type GatewayProvider,
  gatewaysQueryKey,
  type PaymentGateway,
  PROVIDERS,
  type SalesChannelOption,
} from "../../../components/payments/types"
import { sdk } from "../../../lib/sdk"

type StorefrontRow = { key: string; name: string; sales_channel?: { id: string } | null }

const statusOf = (gateway: PaymentGateway) => {
  if (gateway.is_active && gateway.missing_credentials.length) {
    return { color: "red" as const, label: "Keys missing" }
  }
  if (!gateway.is_active) {
    return { color: "grey" as const, label: "Off" }
  }
  if (!gateway.sales_channels.length) {
    return { color: "orange" as const, label: "No storefront" }
  }
  return { color: "green" as const, label: "Active" }
}

const AddGatewayMenu = ({ onPick }: { onPick: (provider: GatewayProvider) => void }) => (
  <DropdownMenu>
    <DropdownMenu.Trigger asChild>
      <Button size="small" variant="secondary" className="shrink-0 whitespace-nowrap">
        <Plus />
        Add payment gateway
      </Button>
    </DropdownMenu.Trigger>
    <DropdownMenu.Content align="end" className="w-80">
      {(Object.keys(PROVIDERS) as GatewayProvider[]).map((provider) => (
        <DropdownMenu.Item key={provider} onClick={() => onPick(provider)} className="flex flex-col items-start gap-y-0.5">
          <span className="txt-compact-small-plus">{PROVIDERS[provider].label}</span>
          <span className="txt-compact-xsmall text-ui-fg-subtle whitespace-normal">
            {PROVIDERS[provider].tagline}
          </span>
        </DropdownMenu.Item>
      ))}
    </DropdownMenu.Content>
  </DropdownMenu>
)

const PaymentsPage = () => {
  const queryClient = useQueryClient()
  const [editor, setEditor] = useState<GatewayEditorTarget | null>(null)
  const [deleting, setDeleting] = useState<PaymentGateway | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: gatewaysQueryKey,
    queryFn: () => sdk.client.fetch<{ payment_gateways: PaymentGateway[] }>("/admin/payment-gateways"),
  })
  const gateways = data?.payment_gateways ?? []

  const { data: channelData } = useQuery({
    queryKey: ["payment-gateways", "sales-channels"],
    queryFn: () =>
      sdk.client.fetch<{ sales_channels: SalesChannelOption[] }>("/admin/sales-channels", {
        query: { limit: 100, fields: "id,name,is_disabled" },
      }),
  })
  const salesChannels = channelData?.sales_channels ?? []

  const { data: storefrontData } = useQuery({
    queryKey: ["storefronts"],
    queryFn: () => sdk.client.fetch<{ storefronts: StorefrontRow[] }>("/admin/storefronts"),
  })
  const storefrontByChannel = useMemo(
    () =>
      new Map(
        (storefrontData?.storefronts ?? [])
          .filter((storefront) => storefront.sales_channel?.id)
          .map((storefront) => [storefront.sales_channel!.id, storefront.name])
      ),
    [storefrontData]
  )

  const { data: regionData } = useQuery({
    queryKey: ["payment-gateways", "regions"],
    queryFn: () =>
      sdk.client.fetch<{ regions: { id: string; currency_code: string }[] }>("/admin/regions", {
        query: { limit: 100, fields: "id,currency_code" },
      }),
  })
  const hasRupiahRegion = !regionData || regionData.regions.some((region) => region.currency_code === "idr")

  const onError = (error: Error) => toast.error("Could not update the gateway", { description: error.message })

  const toggle = useMutation({
    mutationFn: (gateway: PaymentGateway) =>
      sdk.client.fetch(`/admin/payment-gateways/${gateway.id}`, {
        method: "POST",
        body: { is_active: !gateway.is_active },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: gatewaysQueryKey }),
    onError,
  })

  const remove = useMutation({
    mutationFn: (gateway: PaymentGateway) =>
      sdk.client.fetch(`/admin/payment-gateways/${gateway.id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gatewaysQueryKey })
      toast.success("Payment gateway deleted")
    },
    onError,
  })

  const channelLabel = (channel: { id: string; name: string }) =>
    storefrontByChannel.get(channel.id) ?? channel.name

  return (
    <div className="flex flex-col gap-y-3">
      <Container className="divide-y p-0">
        <div className="flex flex-col gap-y-3 px-6 py-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-2xl">
            <Heading>Payments</Heading>
            <Text size="small" className="text-ui-fg-subtle">
              Online payment gateways for the storefront checkouts. Each gateway is a merchant
              account (Midtrans or DOKU) with its own keys; choose which storefronts offer it. Add
              the same gateway twice to use different accounts or method sets per storefront.
            </Text>
          </div>
          <AddGatewayMenu onPick={(provider) => setEditor({ mode: "create", provider })} />
        </div>

        {!hasRupiahRegion && (
          <div className="px-6 py-4">
            <Alert variant="warning">
              No region uses Rupiah (IDR). Midtrans and DOKU only charge in IDR, so no checkout can
              use them until a region does.
            </Alert>
          </div>
        )}

        {isLoading ? (
          <Text size="small" className="text-ui-fg-muted px-6 py-4">
            Loading...
          </Text>
        ) : gateways.length ? (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Gateway</Table.HeaderCell>
                <Table.HeaderCell>Storefronts</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell className="w-px text-right">On</Table.HeaderCell>
                <Table.HeaderCell className="w-px" />
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {gateways.map((gateway) => {
                const status = statusOf(gateway)
                return (
                  <Table.Row
                    key={gateway.id}
                    className="cursor-pointer"
                    onClick={() => setEditor({ mode: "edit", gateway })}
                  >
                    <Table.Cell>
                      <div className="flex flex-col py-2">
                        <div className="flex items-center gap-x-2">
                          <Text size="small" weight="plus">
                            {gateway.name}
                          </Text>
                          <Badge size="2xsmall">{PROVIDERS[gateway.provider].label}</Badge>
                          <Badge size="2xsmall" color={gateway.environment === "production" ? "green" : "orange"}>
                            {gateway.environment === "production" ? "Production" : "Sandbox"}
                          </Badge>
                        </div>
                        {gateway.description && (
                          <Text size="xsmall" className="text-ui-fg-subtle">
                            {gateway.description}
                          </Text>
                        )}
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="small" className="text-ui-fg-subtle">
                        {gateway.sales_channels.length
                          ? gateway.sales_channels.map(channelLabel).join(", ")
                          : "None"}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <StatusBadge color={status.color}>{status.label}</StatusBadge>
                    </Table.Cell>
                    <Table.Cell className="text-right" onClick={(event) => event.stopPropagation()}>
                      <Switch
                        checked={gateway.is_active}
                        disabled={toggle.isPending || (!gateway.is_active && gateway.missing_credentials.length > 0)}
                        onCheckedChange={() => toggle.mutate(gateway)}
                        aria-label={gateway.is_active ? "Turn off" : "Turn on"}
                      />
                    </Table.Cell>
                    <Table.Cell onClick={(event) => event.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenu.Trigger asChild>
                          <IconButton size="small" variant="transparent">
                            <EllipsisHorizontal />
                          </IconButton>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Content align="end">
                          <DropdownMenu.Item onClick={() => setEditor({ mode: "edit", gateway })} className="gap-x-2">
                            <PencilSquare className="text-ui-fg-subtle" />
                            Edit
                          </DropdownMenu.Item>
                          <DropdownMenu.Separator />
                          <DropdownMenu.Item onClick={() => setDeleting(gateway)} className="gap-x-2">
                            <Trash className="text-ui-fg-subtle" />
                            Delete
                          </DropdownMenu.Item>
                        </DropdownMenu.Content>
                      </DropdownMenu>
                    </Table.Cell>
                  </Table.Row>
                )
              })}
            </Table.Body>
          </Table>
        ) : (
          <div className="flex flex-col items-start gap-y-2 px-6 py-8">
            <Text size="small" weight="plus">
              No payment gateways yet
            </Text>
            <Text size="small" className="text-ui-fg-subtle max-w-xl">
              Add Midtrans or DOKU with your sandbox keys to try the checkout. Until then the
              storefronts only offer the manual test payment.
            </Text>
          </div>
        )}
      </Container>

      <Prompt open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <Prompt.Content>
          <Prompt.Header>
            <Prompt.Title>Delete {deleting?.name}?</Prompt.Title>
            <Prompt.Description>
              It disappears from every checkout and its keys are no longer used for new payments.
              Payments already started with it can still be completed.
            </Prompt.Description>
          </Prompt.Header>
          <Prompt.Footer>
            <Prompt.Cancel>Cancel</Prompt.Cancel>
            <Prompt.Action
              onClick={() => {
                if (deleting) {
                  remove.mutate(deleting)
                }
                setDeleting(null)
              }}
            >
              Delete
            </Prompt.Action>
          </Prompt.Footer>
        </Prompt.Content>
      </Prompt>

      {editor && (
        <GatewayEditor
          key={editor.mode === "edit" ? editor.gateway.id : `new-${editor.provider}`}
          target={editor}
          salesChannels={salesChannels}
          storefrontByChannel={storefrontByChannel}
          onClose={() => setEditor(null)}
        />
      )}
    </div>
  )
}

// Listed under Storefronts in the sidebar (nested by folder).
export const config = defineRouteConfig({
  label: "Payments",
  rank: 2,
})

export default PaymentsPage
