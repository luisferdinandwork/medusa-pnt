import { ArrowPath, ArrowUpRightOnBox, CheckCircleSolid, XCircle } from "@medusajs/icons"
import {
  Badge,
  Button,
  Checkbox,
  clx,
  Copy,
  FocusModal,
  Heading,
  Input,
  Label,
  StatusBadge,
  Switch,
  Table,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { blankToNull, Field, SectionCard } from "../content/ui"
import { sdk } from "../../lib/sdk"
import {
  backendUrl,
  DEFAULT_REDIRECTS,
  type GatewayEnvironment,
  type GatewayProvider,
  type GatewayTransaction,
  gatewayQueryKey,
  gatewaysQueryKey,
  type PaymentGateway,
  PROVIDERS,
  type SalesChannelOption,
  STATUS_COLOR,
} from "./types"

type FormValues = {
  provider: GatewayProvider
  name: string
  description: string
  environment: GatewayEnvironment
  is_active: boolean
  credentials: Record<string, string>
  sales_channel_ids: string[]
  all_methods: boolean
  payment_methods: string[]
  expiry_minutes: string
  success_url: string
  pending_url: string
  failure_url: string
  notification_url: string
}

const emptyForm = (provider: GatewayProvider, salesChannelIds: string[]): FormValues => ({
  provider,
  name: PROVIDERS[provider].defaultName,
  description: PROVIDERS[provider].defaultDescription,
  environment: "sandbox",
  is_active: true,
  credentials: {},
  sales_channel_ids: salesChannelIds,
  all_methods: true,
  payment_methods: [],
  expiry_minutes: "1440",
  success_url: DEFAULT_REDIRECTS.success_url,
  pending_url: DEFAULT_REDIRECTS.pending_url,
  failure_url: DEFAULT_REDIRECTS.failure_url,
  notification_url: "",
})

const toForm = (gateway: PaymentGateway): FormValues => ({
  provider: gateway.provider,
  name: gateway.name,
  description: gateway.description ?? "",
  environment: gateway.environment,
  is_active: gateway.is_active,
  // Public values are shown; secrets stay blank ("keep the saved one").
  credentials: Object.fromEntries(
    Object.entries(gateway.credentials).map(([key, state]) => [
      key,
      "value" in state ? state.value ?? "" : "",
    ])
  ),
  sales_channel_ids: gateway.sales_channels.map((channel) => channel.id),
  all_methods: !gateway.payment_methods?.length,
  payment_methods: gateway.payment_methods ?? [],
  expiry_minutes: String(gateway.expiry_minutes),
  success_url: gateway.success_url ?? "",
  pending_url: gateway.pending_url ?? "",
  failure_url: gateway.failure_url ?? "",
  notification_url: gateway.notification_url ?? "",
})

const toPayload = (form: FormValues) => ({
  name: form.name.trim(),
  description: blankToNull(form.description),
  environment: form.environment,
  is_active: form.is_active,
  credentials: form.credentials,
  sales_channel_ids: form.sales_channel_ids,
  payment_methods: form.all_methods ? null : form.payment_methods,
  expiry_minutes: Number(form.expiry_minutes),
  success_url: blankToNull(form.success_url),
  pending_url: blankToNull(form.pending_url),
  failure_url: blankToNull(form.failure_url),
  notification_url: blankToNull(form.notification_url),
})

const EXPIRY_PRESETS = [
  { minutes: 60, label: "1 hour" },
  { minutes: 60 * 24, label: "24 hours" },
  { minutes: 60 * 24 * 3, label: "3 days" },
]

const Segmented = <T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}) => (
  <div className="bg-ui-bg-component border-ui-border-base inline-flex w-fit rounded-md border p-0.5">
    {options.map((option) => (
      <button
        key={option.value}
        type="button"
        onClick={() => onChange(option.value)}
        className={clx(
          "txt-compact-small rounded px-3 py-1 transition-fg",
          option.value === value
            ? "bg-ui-bg-base text-ui-fg-base shadow-elevation-card-rest font-medium"
            : "text-ui-fg-subtle hover:text-ui-fg-base"
        )}
      >
        {option.label}
      </button>
    ))}
  </div>
)

const formatRupiah = (amount: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount)

const formatWhen = (value: string) =>
  new Date(value).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })

const TransactionsCard = ({ transactions }: { transactions: GatewayTransaction[] }) => (
  <div className="bg-ui-bg-base shadow-elevation-card-rest flex flex-col rounded-lg">
    <div className="px-4 py-3">
      <Text size="small" weight="plus">
        Latest payments
      </Text>
      <Text size="xsmall" className="text-ui-fg-subtle">
        Every charge created at the gateway. An order exists once a charge is paid.
      </Text>
    </div>
    {transactions.length ? (
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Reference</Table.HeaderCell>
            <Table.HeaderCell>Amount</Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {transactions.map((transaction) => (
            <Table.Row key={transaction.id}>
              <Table.Cell>
                <div className="flex flex-col py-1">
                  <span className="txt-compact-xsmall font-mono">{transaction.reference}</span>
                  <span className="txt-compact-xsmall text-ui-fg-muted">
                    {formatWhen(transaction.created_at)}
                    {transaction.payment_method ? ` · ${transaction.payment_method}` : ""}
                  </span>
                </div>
              </Table.Cell>
              <Table.Cell className="txt-compact-small">{formatRupiah(Number(transaction.amount))}</Table.Cell>
              <Table.Cell>
                <StatusBadge color={STATUS_COLOR[transaction.status]}>{transaction.status}</StatusBadge>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    ) : (
      <Text size="small" className="text-ui-fg-muted px-4 pb-4">
        No payments yet.
      </Text>
    )}
  </div>
)

export type GatewayEditorTarget =
  | { mode: "create"; provider: GatewayProvider }
  | { mode: "edit"; gateway: PaymentGateway }

/**
 * Create or edit a payment gateway: its keys, the storefronts (sales
 * channels) that offer it, the methods it shows, where shoppers land after
 * paying and where the gateway sends its notifications.
 */
export const GatewayEditor = ({
  target,
  salesChannels,
  storefrontByChannel,
  onClose,
}: {
  target: GatewayEditorTarget
  salesChannels: SalesChannelOption[]
  storefrontByChannel: Map<string, string>
  onClose: () => void
}) => {
  const queryClient = useQueryClient()
  const isEdit = target.mode === "edit"
  const gateway = isEdit ? target.gateway : undefined
  const [form, setForm] = useState<FormValues>(() =>
    isEdit
      ? toForm(target.gateway)
      : emptyForm(
          target.provider,
          salesChannels.filter((channel) => !channel.is_disabled).map((channel) => channel.id)
        )
  )
  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) =>
    setForm((current) => ({ ...current, [key]: value }))
  const text = (key: keyof FormValues) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => set(key, event.target.value as never)
  const setCredential = (key: string, value: string) =>
    setForm((current) => ({ ...current, credentials: { ...current.credentials, [key]: value } }))
  const toggleIn = (key: "sales_channel_ids" | "payment_methods", id: string, on: boolean) =>
    setForm((current) => ({
      ...current,
      [key]: on ? [...new Set([...current[key], id])] : current[key].filter((item) => item !== id),
    }))

  const info = PROVIDERS[form.provider]
  const webhookUrl = `${backendUrl()}/hooks/payment/${form.provider}_${form.provider}`

  const { data: detail } = useQuery({
    queryKey: gatewayQueryKey(gateway?.id ?? "new"),
    queryFn: () =>
      sdk.client.fetch<{ payment_gateway: PaymentGateway; transactions: GatewayTransaction[] }>(
        `/admin/payment-gateways/${gateway!.id}`
      ),
    enabled: !!gateway,
  })

  // A required credential is filled when typed now or already saved.
  const missingKeys = info.credentials
    .filter((field) => field.required)
    .filter((field) => !form.credentials[field.key]?.trim() && !gateway?.credentials[field.key]?.set)
    .map((field) => field.label)
  const expiry = Number(form.expiry_minutes)
  const problems = [
    !form.name.trim() && "a name",
    form.is_active && missingKeys.length > 0 && `the ${missingKeys.join(" and ")} (or turn the gateway off)`,
    (!Number.isInteger(expiry) || expiry < 5) && "a payment time limit of at least 5 minutes",
    !form.all_methods && !form.payment_methods.length && "at least one payment method",
  ].filter(Boolean)

  const save = useMutation({
    mutationFn: () =>
      isEdit
        ? sdk.client.fetch<{ payment_gateway: PaymentGateway }>(`/admin/payment-gateways/${target.gateway.id}`, {
            method: "POST",
            body: toPayload(form),
          })
        : sdk.client.fetch<{ payment_gateway: PaymentGateway }>("/admin/payment-gateways", {
            method: "POST",
            body: { provider: form.provider, ...toPayload(form) },
          }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gatewaysQueryKey })
      toast.success(isEdit ? "Payment gateway saved" : "Payment gateway added", {
        description: "Storefronts show the change at checkout right away.",
      })
      onClose()
    },
    onError: (error: Error) => toast.error("Could not save the gateway", { description: error.message }),
  })

  const test = useMutation({
    mutationFn: () =>
      sdk.client.fetch<{ ok: boolean; message: string }>(
        `/admin/payment-gateways/${gateway!.id}/test`,
        { method: "POST" }
      ),
    onSuccess: (result) =>
      result.ok
        ? toast.success("Connection works", { description: result.message })
        : toast.error("Connection failed", { description: result.message }),
    onError: (error: Error) => toast.error("Could not test the connection", { description: error.message }),
  })
  const typedNewKeys = info.credentials.some(
    (field) => form.credentials[field.key] !== (gateway ? toForm(gateway).credentials[field.key] : "")
  )

  const methodGroups = [...new Set(info.methods.map((method) => method.group))]

  return (
    <FocusModal open onOpenChange={(open) => !open && onClose()}>
      <FocusModal.Content>
        <FocusModal.Header>
          <div className="flex items-center gap-x-2">
            {problems.length > 0 && (
              <Text size="small" className="text-ui-fg-subtle hidden md:block">
                Add {problems.join(", ")} to save.
              </Text>
            )}
            <FocusModal.Close asChild>
              <Button size="small" variant="secondary">
                Cancel
              </Button>
            </FocusModal.Close>
            <Button
              size="small"
              onClick={() => save.mutate()}
              isLoading={save.isPending}
              disabled={problems.length > 0}
            >
              {isEdit ? "Save" : "Add gateway"}
            </Button>
          </div>
        </FocusModal.Header>
        <FocusModal.Body className="overflow-y-auto">
          <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-6 p-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <div className="flex flex-col gap-y-3">
              <div className="px-1">
                <FocusModal.Title asChild>
                  <Heading>{isEdit ? `Edit ${gateway!.name}` : `New ${info.label} gateway`}</Heading>
                </FocusModal.Title>
                <FocusModal.Description asChild>
                  <Text size="small" className="text-ui-fg-subtle">
                    {info.tagline}
                  </Text>
                </FocusModal.Description>
              </div>

              <SectionCard
                title="Checkout option"
                description="How the gateway appears in the payment step of the checkout."
              >
                <Field label="Name" hint="Shown to shoppers, e.g. Transfer Bank & E-Wallet.">
                  <Input value={form.name} onChange={text("name")} />
                </Field>
                <Field label="Description" optional hint="One line under the name at checkout.">
                  <Textarea value={form.description} onChange={text("description")} rows={2} />
                </Field>
                <div className="flex items-center justify-between gap-x-4">
                  <div>
                    <Label size="small" weight="plus" htmlFor="gateway-active">
                      Offer at checkout
                    </Label>
                    <Text size="xsmall" className="text-ui-fg-subtle">
                      Turned off, the gateway stays here with its keys but no storefront shows it.
                    </Text>
                  </div>
                  <Switch
                    id="gateway-active"
                    checked={form.is_active}
                    onCheckedChange={(checked) => set("is_active", checked)}
                  />
                </div>
              </SectionCard>

              <SectionCard
                title="API keys"
                description={`Find them in ${info.keysWhere}. Sandbox and production have different keys.`}
                actions={
                  <a
                    href={info.dashboard[form.environment]}
                    target="_blank"
                    rel="noreferrer"
                    className="txt-compact-small text-ui-fg-interactive hover:text-ui-fg-interactive-hover flex shrink-0 items-center gap-x-1"
                  >
                    Open dashboard
                    <ArrowUpRightOnBox />
                  </a>
                }
              >
                <Field
                  label="Environment"
                  hint={
                    form.environment === "sandbox"
                      ? "Test mode: no real money moves. Use the gateway's simulator to pay."
                      : "Live: shoppers are charged for real."
                  }
                >
                  <Segmented
                    value={form.environment}
                    onChange={(value) => set("environment", value)}
                    options={[
                      { value: "sandbox", label: "Sandbox" },
                      { value: "production", label: "Production" },
                    ]}
                  />
                </Field>
                {info.credentials.map((field) => {
                  const saved = gateway?.credentials[field.key]
                  const savedSecret = field.secret && saved?.set && "last4" in saved
                  return (
                    <Field
                      key={field.key}
                      label={field.label}
                      optional={!field.required}
                      hint={savedSecret ? `Saved, ends with ${saved.last4}. Leave blank to keep it.` : field.hint}
                    >
                      <Input
                        type={field.secret ? "password" : "text"}
                        autoComplete="off"
                        value={form.credentials[field.key] ?? ""}
                        onChange={(event) => setCredential(field.key, event.target.value)}
                        placeholder={savedSecret ? "••••••••••••" : field.placeholder}
                      />
                    </Field>
                  )
                })}
                {isEdit && (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <Button
                      size="small"
                      variant="secondary"
                      onClick={() => test.mutate()}
                      isLoading={test.isPending}
                      disabled={!!gateway!.missing_credentials.length}
                    >
                      <ArrowPath />
                      Test connection
                    </Button>
                    {test.data && (
                      <span className="txt-compact-small flex items-center gap-x-1">
                        {test.data.ok ? (
                          <CheckCircleSolid className="text-ui-tag-green-icon" />
                        ) : (
                          <XCircle className="text-ui-tag-red-icon" />
                        )}
                        {test.data.ok ? "Keys accepted" : "Keys rejected"}
                      </span>
                    )}
                    <Text size="xsmall" className="text-ui-fg-muted">
                      {typedNewKeys ? "Tests the saved keys; save first to test what you typed." : "Tests the saved keys without creating a payment."}
                    </Text>
                  </div>
                )}
              </SectionCard>

              <SectionCard
                title="Storefronts"
                description="The sales channels whose checkout offers this gateway. Each storefront only lists its own."
              >
                {salesChannels.length ? (
                  <div className="flex flex-col gap-y-2">
                    {salesChannels.map((channel) => {
                      const storefront = storefrontByChannel.get(channel.id)
                      return (
                        <div key={channel.id} className="flex items-center gap-x-2">
                          <Checkbox
                            id={`channel-${channel.id}`}
                            checked={form.sales_channel_ids.includes(channel.id)}
                            onCheckedChange={(checked) => toggleIn("sales_channel_ids", channel.id, checked === true)}
                          />
                          <Label htmlFor={`channel-${channel.id}`} size="small">
                            {storefront ?? channel.name}
                            {storefront && storefront !== channel.name && (
                              <span className="text-ui-fg-muted"> · {channel.name}</span>
                            )}
                          </Label>
                          {channel.is_disabled && <Badge size="2xsmall">Disabled channel</Badge>}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <Text size="small" className="text-ui-fg-muted">
                    No sales channels yet.
                  </Text>
                )}
                {form.is_active && !form.sales_channel_ids.length && (
                  <Text size="small" className="text-ui-fg-subtle">
                    No storefront selected: the gateway is on, but no checkout shows it.
                  </Text>
                )}
              </SectionCard>

              <SectionCard
                title="Payment methods"
                description="Which methods the payment page shows. Only methods activated for your account in the gateway dashboard can appear."
              >
                <div className="flex items-center gap-x-2">
                  <Checkbox
                    id="all-methods"
                    checked={form.all_methods}
                    onCheckedChange={(checked) => set("all_methods", checked === true)}
                  />
                  <Label htmlFor="all-methods" size="small">
                    Every method active on the account
                  </Label>
                </div>
                {!form.all_methods && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {methodGroups.map((group) => (
                      <div key={group} className="flex flex-col gap-y-2">
                        <Text size="xsmall" weight="plus" className="text-ui-fg-subtle">
                          {group}
                        </Text>
                        {info.methods
                          .filter((method) => method.group === group)
                          .map((method) => (
                            <div key={method.code} className="flex items-center gap-x-2">
                              <Checkbox
                                id={`method-${method.code}`}
                                checked={form.payment_methods.includes(method.code)}
                                onCheckedChange={(checked) => toggleIn("payment_methods", method.code, checked === true)}
                              />
                              <Label htmlFor={`method-${method.code}`} size="small">
                                {method.label}
                              </Label>
                            </div>
                          ))}
                      </div>
                    ))}
                  </div>
                )}
                <Field label="Time to pay" hint="How long a VA number, QR code or payment page stays valid.">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="w-28">
                      <Input
                        type="number"
                        min={5}
                        value={form.expiry_minutes}
                        onChange={text("expiry_minutes")}
                      />
                    </div>
                    <Text size="small" className="text-ui-fg-subtle">
                      minutes
                    </Text>
                    {EXPIRY_PRESETS.map((preset) => (
                      <Button
                        key={preset.minutes}
                        size="small"
                        variant={Number(form.expiry_minutes) === preset.minutes ? "primary" : "transparent"}
                        onClick={() => set("expiry_minutes", String(preset.minutes))}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                </Field>
              </SectionCard>

              <SectionCard
                title="After payment"
                description="The gateway always sends the shopper back to the storefront, which checks the payment and creates the order. It then opens one of these pages."
              >
                <Field label="Paid" hint="Leave empty for the order confirmation page.">
                  <Input value={form.success_url} onChange={text("success_url")} placeholder={DEFAULT_REDIRECTS.success_url} />
                </Field>
                <Field label="Waiting for payment" hint="E.g. a VA was issued and not paid yet. The default page re-checks on its own.">
                  <Input value={form.pending_url} onChange={text("pending_url")} placeholder={DEFAULT_REDIRECTS.pending_url} />
                </Field>
                <Field label="Failed or cancelled" hint="Leave empty to go back to the payment step.">
                  <Input value={form.failure_url} onChange={text("failure_url")} placeholder={DEFAULT_REDIRECTS.failure_url} />
                </Field>
                <Text size="xsmall" className="text-ui-fg-subtle">
                  A path starting with / opens on the storefront the shopper is on; a full URL
                  (https://...) opens as is. {"{country_code}"}, {"{order_id}"} and {"{cart_id}"} are
                  filled in.
                </Text>
              </SectionCard>

              <SectionCard
                title="Notifications"
                description="The gateway tells the backend when a payment settles, so orders are created even when the shopper closes the tab."
              >
                <Field label="Notification URL for the gateway dashboard" hint={info.webhookHelp}>
                  <div className="bg-ui-bg-subtle border-ui-border-base flex items-center justify-between gap-x-2 rounded-md border px-3 py-1.5">
                    <code className="txt-compact-small truncate">{webhookUrl}</code>
                    <Copy content={webhookUrl} />
                  </div>
                </Field>
                <Field
                  label="Override for this gateway"
                  optional
                  hint="Sent with every payment instead of the dashboard setting. Useful in development: a public tunnel to this backend, e.g. https://abc.ngrok.app/hooks/payment/..."
                >
                  <Input
                    value={form.notification_url}
                    onChange={text("notification_url")}
                    placeholder={`https://.../hooks/payment/${form.provider}_${form.provider}`}
                  />
                </Field>
              </SectionCard>
            </div>

            <div className="flex flex-col gap-y-3 lg:sticky lg:top-0 lg:self-start">
              <div className="bg-ui-bg-base shadow-elevation-card-rest flex flex-col gap-y-3 rounded-lg p-4">
                <Text size="small" weight="plus" className="text-ui-fg-subtle">
                  At checkout
                </Text>
                <div className="border-ui-border-interactive flex items-start gap-x-3 rounded-md border px-4 py-3">
                  <span className="border-ui-border-interactive mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border">
                    <span className="bg-ui-fg-interactive h-2 w-2 rounded-full" />
                  </span>
                  <div className="min-w-0">
                    <Text size="small" weight="plus">
                      {form.name || info.defaultName}
                    </Text>
                    {form.description && (
                      <Text size="xsmall" className="text-ui-fg-subtle">
                        {form.description}
                      </Text>
                    )}
                  </div>
                  {form.environment === "sandbox" && (
                    <Badge size="2xsmall" color="orange" className="ml-auto shrink-0">
                      Sandbox
                    </Badge>
                  )}
                </div>
                <Text size="xsmall" className="text-ui-fg-muted">
                  &quot;Bayar Sekarang&quot; sends the shopper to the {info.label} payment page,
                  then back to the storefront.
                </Text>
              </div>
              {gateway && <TransactionsCard transactions={detail?.transactions ?? []} />}
            </div>
          </div>
        </FocusModal.Body>
      </FocusModal.Content>
    </FocusModal>
  )
}
