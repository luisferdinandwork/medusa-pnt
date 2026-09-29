import { ArrowUpRightOnBox, ExclamationCircle } from "@medusajs/icons"
import {
  Alert,
  Badge,
  Button,
  clx,
  CurrencyInput,
  DatePicker,
  Drawer,
  Heading,
  Input,
  Label,
  Skeleton,
  StatusBadge,
  Switch,
  Text,
  toast,
} from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Link } from "react-router-dom"
import { sdk } from "../../lib/sdk"
import {
  currencyDecimals,
  currencySymbol,
  formatMoney,
  percentOff,
  roundPrice,
  SALE_STATE_COLOR,
  SALE_STATE_LABEL,
  salePeriodText,
} from "./money"
import {
  PRICING_LIST_QUERY_KEY,
  pricingQueryKey,
  type ProductPricing,
  type SaleState,
} from "./types"

type VariantRow = {
  id: string
  title: string
  sku: string | null
  base: string
  sale: string
  region_price_count: number
}

type FormState = {
  rows: VariantRow[]
  on_sale: boolean
  starts_at: Date | null
  ends_at: Date | null
  remove_compare_at: boolean
}

const toText = (amount: number | null) => (amount === null ? "" : String(amount))

const toNumber = (value: string) => {
  const parsed = Number(value.replace(",", "."))
  return value.trim() === "" || !Number.isFinite(parsed) ? null : parsed
}

const toForm = (pricing: ProductPricing): FormState => ({
  rows: pricing.variants.map((variant) => ({
    id: variant.id,
    title: variant.title,
    sku: variant.sku,
    base: toText(variant.base_amount),
    sale: toText(variant.sale_amount),
    region_price_count: variant.region_price_count,
  })),
  on_sale: !!pricing.sale,
  starts_at: pricing.sale?.starts_at ? new Date(pricing.sale.starts_at) : null,
  ends_at: pricing.sale?.ends_at ? new Date(pricing.sale.ends_at) : null,
  remove_compare_at: false,
})

// The date pickers pick days: a sale runs from the start of its first day to
// the end of its last one.
const startOfDay = (date: Date) => {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}
const endOfDay = (date: Date) => {
  const next = new Date(date)
  next.setHours(23, 59, 59, 999)
  return next
}

const saleStateOf = (form: FormState, now = new Date()): SaleState | null => {
  if (!form.on_sale) {
    return null
  }
  if (form.starts_at && startOfDay(form.starts_at) > now) {
    return "scheduled"
  }
  if (form.ends_at && endOfDay(form.ends_at) <= now) {
    return "expired"
  }
  return "live"
}

const rowError = (row: VariantRow, onSale: boolean) => {
  const base = toNumber(row.base)
  const sale = toNumber(row.sale)
  if (onSale && sale !== null) {
    if (base === null) {
      return "Set a regular price first."
    }
    if (sale >= base) {
      return "Must be lower than the regular price."
    }
  }
  return null
}

const MoneyInput = ({
  value,
  onChange,
  currencyCode,
  placeholder,
  invalid,
  ariaLabel,
}: {
  value: string
  onChange: (value: string) => void
  currencyCode: string
  placeholder?: string
  invalid?: boolean
  ariaLabel: string
}) => {
  const decimals = currencyDecimals(currencyCode)
  return (
    <CurrencyInput
      size="small"
      symbol={currencySymbol(currencyCode)}
      code={currencyCode.toUpperCase()}
      value={value}
      placeholder={placeholder}
      aria-label={ariaLabel}
      aria-invalid={invalid || undefined}
      allowNegativeValue={false}
      decimalsLimit={decimals}
      allowDecimals={decimals > 0}
      groupSeparator="."
      decimalSeparator=","
      onValueChange={(next) => onChange(next ?? "")}
    />
  )
}

/** Apply-to-all helper: an input and a button in one row. */
const BulkAction = ({
  label,
  children,
  onApply,
  disabled,
}: {
  label: string
  children: React.ReactNode
  onApply: () => void
  disabled?: boolean
}) => (
  <div className="flex items-end gap-x-2">
    <div className="flex flex-1 flex-col gap-y-1">
      <Label size="xsmall" weight="plus" className="text-ui-fg-subtle">
        {label}
      </Label>
      {children}
    </div>
    <Button size="small" variant="secondary" type="button" onClick={onApply} disabled={disabled}>
      Apply to all
    </Button>
  </div>
)

const Editor = ({
  pricing,
  onDone,
}: {
  pricing: ProductPricing
  onDone: () => void
}) => {
  const queryClient = useQueryClient()
  const currency = pricing.currency_code
  const [form, setForm] = useState<FormState>(() => toForm(pricing))
  const [allBase, setAllBase] = useState("")
  const [allSale, setAllSale] = useState("")
  const [percent, setPercent] = useState("")

  const setRow = (id: string, patch: Partial<VariantRow>) =>
    setForm((current) => ({
      ...current,
      rows: current.rows.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    }))

  const applyPercent = () => {
    const pct = Number(percent)
    if (!Number.isFinite(pct) || pct <= 0 || pct >= 100) {
      toast.error("Enter a discount between 1 and 99%.")
      return
    }
    setForm((current) => ({
      ...current,
      on_sale: true,
      rows: current.rows.map((row) => {
        const base = toNumber(row.base)
        return base === null
          ? row
          : { ...row, sale: String(roundPrice(base * (1 - pct / 100), currency)) }
      }),
    }))
  }

  // The seed's display-only "was" price becomes the regular price, and what
  // shoppers paid until now becomes the sale price, so the storefront keeps
  // showing the same numbers but checkout now charges through a real sale.
  const convertCompareAt = () => {
    const compareAt = pricing.legacy_compare_at
    if (compareAt === null) {
      return
    }
    setForm((current) => ({
      ...current,
      on_sale: true,
      remove_compare_at: true,
      rows: current.rows.map((row) => {
        const base = toNumber(row.base)
        return base !== null && base < compareAt
          ? { ...row, base: String(compareAt), sale: String(base) }
          : row
      }),
    }))
  }

  const errors = new Map(
    form.rows.map((row) => [row.id, rowError(row, form.on_sale)] as const)
  )
  const hasErrors = [...errors.values()].some(Boolean)
  const hasSalePrice = form.rows.some((row) => toNumber(row.sale) !== null)
  const periodInvalid =
    !!form.starts_at && !!form.ends_at && endOfDay(form.ends_at) <= startOfDay(form.starts_at)
  const state = saleStateOf(form)

  const save = useMutation({
    mutationFn: () =>
      sdk.client.fetch<{ pricing: ProductPricing }>(
        `/admin/product-pricing/${pricing.product.id}`,
        {
          method: "POST",
          body: {
            variants: form.rows.map((row) => {
              const sale = toNumber(row.sale)
              return {
                id: row.id,
                base_amount: toNumber(row.base),
                sale_amount: form.on_sale ? sale : null,
              }
            }),
            sale_starts_at:
              form.on_sale && form.starts_at ? startOfDay(form.starts_at).toISOString() : null,
            sale_ends_at:
              form.on_sale && form.ends_at ? endOfDay(form.ends_at).toISOString() : null,
            remove_compare_at: form.remove_compare_at,
          },
        }
      ),
    onSuccess: ({ pricing: saved }) => {
      queryClient.setQueryData(pricingQueryKey(saved.product.id), { pricing: saved })
      queryClient.invalidateQueries({ queryKey: PRICING_LIST_QUERY_KEY })
      // Core admin pages (product variants, price lists) cache their own copies.
      queryClient.invalidateQueries({
        predicate: (query) =>
          ["products", "product_variants", "price_lists"].includes(String(query.queryKey[0])),
      })
      toast.success("Prices saved", {
        description: "The storefront shows the new prices within a minute.",
      })
      onDone()
    },
    onError: (error: Error) => toast.error("Could not save prices", { description: error.message }),
  })

  return (
    <>
      <Drawer.Body className="flex flex-col gap-y-8 overflow-y-auto">
        {pricing.legacy_compare_at !== null && !form.remove_compare_at && (
          <Alert variant="warning" className="flex flex-col gap-y-3">
            <Text size="small">
              This product shows a crossed-out &quot;was&quot; price of{" "}
              <strong>{formatMoney(pricing.legacy_compare_at, currency)}</strong> stored in its
              metadata. It is only a label: shoppers pay the regular price below. Turn it into a
              real sale so the discount is applied at checkout and can be scheduled.
            </Text>
            <div className="flex gap-x-2">
              <Button size="small" variant="secondary" type="button" onClick={convertCompareAt}>
                Convert to a sale
              </Button>
              <Button
                size="small"
                variant="transparent"
                type="button"
                onClick={() => setForm((c) => ({ ...c, remove_compare_at: true }))}
              >
                Just remove it
              </Button>
            </div>
          </Alert>
        )}
        {form.remove_compare_at && (
          <Text size="small" className="text-ui-fg-subtle">
            The old &quot;was&quot; price will be removed when you save.
          </Text>
        )}

        <section className="flex flex-col gap-y-4">
          <div>
            <Heading level="h3">Regular price</Heading>
            <Text size="small" className="text-ui-fg-subtle">
              What each size costs when there is no sale, in {currency.toUpperCase()}.
            </Text>
          </div>
          {form.rows.length > 1 && (
            <BulkAction
              label="Same regular price for every variant"
              disabled={toNumber(allBase) === null}
              onApply={() =>
                setForm((current) => ({
                  ...current,
                  rows: current.rows.map((row) => ({ ...row, base: allBase })),
                }))
              }
            >
              <MoneyInput
                value={allBase}
                onChange={setAllBase}
                currencyCode={currency}
                ariaLabel="Regular price for all variants"
              />
            </BulkAction>
          )}
        </section>

        <section className="flex flex-col gap-y-4">
          <div className="flex items-start justify-between gap-x-4">
            <div>
              <Heading level="h3">Sale</Heading>
              <Text size="small" className="text-ui-fg-subtle">
                A lower price for a period. The storefront shows the regular price crossed out.
              </Text>
            </div>
            <div className="flex items-center gap-x-2 pt-1">
              <Label htmlFor="pricing-on-sale" size="small" weight="plus">
                On sale
              </Label>
              <Switch
                id="pricing-on-sale"
                checked={form.on_sale}
                onCheckedChange={(checked) => setForm((c) => ({ ...c, on_sale: checked }))}
              />
            </div>
          </div>

          {form.on_sale && (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <BulkAction
                  label="Discount (%)"
                  disabled={!percent}
                  onApply={applyPercent}
                >
                  <Input
                    size="small"
                    type="number"
                    min={1}
                    max={99}
                    placeholder="20"
                    aria-label="Discount percentage"
                    value={percent}
                    onChange={(event) => setPercent(event.target.value)}
                  />
                </BulkAction>
                <BulkAction
                  label="Same sale price"
                  disabled={toNumber(allSale) === null}
                  onApply={() =>
                    setForm((current) => ({
                      ...current,
                      rows: current.rows.map((row) => ({ ...row, sale: allSale })),
                    }))
                  }
                >
                  <MoneyInput
                    value={allSale}
                    onChange={setAllSale}
                    currencyCode={currency}
                    ariaLabel="Sale price for all variants"
                  />
                </BulkAction>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-y-1">
                  <Label size="xsmall" weight="plus" className="text-ui-fg-subtle">
                    Starts
                  </Label>
                  <DatePicker
                    size="small"
                    value={form.starts_at}
                    onChange={(value) => setForm((c) => ({ ...c, starts_at: value }))}
                  />
                </div>
                <div className="flex flex-col gap-y-1">
                  <Label size="xsmall" weight="plus" className="text-ui-fg-subtle">
                    Ends (last day)
                  </Label>
                  <DatePicker
                    size="small"
                    value={form.ends_at}
                    onChange={(value) => setForm((c) => ({ ...c, ends_at: value }))}
                  />
                </div>
              </div>
              {periodInvalid ? (
                <Text size="small" className="text-ui-fg-error">
                  The last day must be on or after the first day.
                </Text>
              ) : (
                state && (
                  <div className="flex items-center gap-x-2">
                    <StatusBadge color={SALE_STATE_COLOR[state]}>{SALE_STATE_LABEL[state]}</StatusBadge>
                    <Text size="small" className="text-ui-fg-subtle">
                      {salePeriodText({
                        state,
                        starts_at: form.starts_at ? startOfDay(form.starts_at).toISOString() : null,
                        ends_at: form.ends_at ? endOfDay(form.ends_at).toISOString() : null,
                      })}
                      {!form.starts_at && !form.ends_at && " - leave both empty to run until you switch it off"}
                    </Text>
                  </div>
                )
              )}
            </>
          )}
        </section>

        <section className="flex flex-col">
          <div
            className={clx(
              "text-ui-fg-subtle grid items-center gap-x-3 border-b border-ui-border-base pb-2",
              form.on_sale ? "grid-cols-[minmax(0,1fr)_150px_150px_48px]" : "grid-cols-[minmax(0,1fr)_170px]"
            )}
          >
            <Text size="xsmall" weight="plus">Variant</Text>
            <Text size="xsmall" weight="plus">Regular</Text>
            {form.on_sale && (
              <>
                <Text size="xsmall" weight="plus">Sale</Text>
                <Text size="xsmall" weight="plus" className="text-right">Off</Text>
              </>
            )}
          </div>
          {form.rows.map((row) => {
            const base = toNumber(row.base)
            const sale = toNumber(row.sale)
            const error = errors.get(row.id)
            return (
              <div key={row.id} className="flex flex-col gap-y-1 border-b border-ui-border-base py-2 last:border-b-0">
                <div
                  className={clx(
                    "grid items-center gap-x-3",
                    form.on_sale ? "grid-cols-[minmax(0,1fr)_150px_150px_48px]" : "grid-cols-[minmax(0,1fr)_170px]"
                  )}
                >
                  <div className="min-w-0">
                    <Text size="small" weight="plus" className="truncate">{row.title}</Text>
                    {row.sku && (
                      <Text size="xsmall" className="text-ui-fg-muted truncate">{row.sku}</Text>
                    )}
                  </div>
                  <MoneyInput
                    value={row.base}
                    onChange={(value) => setRow(row.id, { base: value })}
                    currencyCode={currency}
                    placeholder="No price"
                    ariaLabel={`Regular price, ${row.title}`}
                  />
                  {form.on_sale && (
                    <>
                      <MoneyInput
                        value={row.sale}
                        onChange={(value) => setRow(row.id, { sale: value })}
                        currencyCode={currency}
                        placeholder="Not on sale"
                        invalid={!!error}
                        ariaLabel={`Sale price, ${row.title}`}
                      />
                      <Text size="small" className="text-ui-fg-subtle text-right tabular-nums">
                        {base !== null && sale !== null && sale < base ? `-${percentOff(base, sale)}%` : ""}
                      </Text>
                    </>
                  )}
                </div>
                {error && (
                  <Text size="xsmall" className="text-ui-fg-error flex items-center gap-x-1">
                    <ExclamationCircle />
                    {error}
                  </Text>
                )}
                {row.region_price_count > 0 && (
                  <Text size="xsmall" className="text-ui-fg-muted">
                    Also has {row.region_price_count} region price(s), which win over the regular
                    price in that region. Edit them from the Variants section.
                  </Text>
                )}
              </div>
            )
          })}
          {form.rows.length === 0 && (
            <Text size="small" className="text-ui-fg-muted py-4">
              This product has no variants yet.
            </Text>
          )}
        </section>

        {pricing.other_price_lists.length > 0 && (
          <section className="flex flex-col gap-y-2">
            <Heading level="h3">Other price lists</Heading>
            <Text size="small" className="text-ui-fg-subtle">
              These lists also price this product. When several apply, the shopper gets the
              lowest price.
            </Text>
            {pricing.other_price_lists.map((list) => (
              <Link
                key={list.id}
                to={`/price-lists/${list.id}`}
                className="bg-ui-bg-subtle hover:bg-ui-bg-subtle-hover flex items-center justify-between gap-x-3 rounded-md px-3 py-2"
              >
                <div className="min-w-0">
                  <Text size="small" weight="plus" className="truncate">{list.title}</Text>
                  <Text size="xsmall" className="text-ui-fg-muted">
                    {list.type === "sale" ? "Sale" : "Override"} - {list.variant_count} variant(s) -{" "}
                    {salePeriodText(list)}
                  </Text>
                </div>
                <div className="flex items-center gap-x-2">
                  <StatusBadge color={SALE_STATE_COLOR[list.state]}>{SALE_STATE_LABEL[list.state].replace("Sale ", "")}</StatusBadge>
                  <ArrowUpRightOnBox className="text-ui-fg-muted" />
                </div>
              </Link>
            ))}
          </section>
        )}
      </Drawer.Body>
      <Drawer.Footer>
        {form.on_sale && !hasSalePrice && (
          <Text size="small" className="text-ui-fg-subtle mr-auto">
            No sale prices entered - saving ends the sale.
          </Text>
        )}
        <Drawer.Close asChild>
          <Button variant="secondary" type="button">Cancel</Button>
        </Drawer.Close>
        <Button
          type="button"
          onClick={() => save.mutate()}
          isLoading={save.isPending}
          disabled={hasErrors || periodInvalid}
        >
          Save prices
        </Button>
      </Drawer.Footer>
    </>
  )
}

const fetchPricing = (productId: string) =>
  sdk.client.fetch<{ pricing: ProductPricing }>(`/admin/product-pricing/${productId}`)

export const usePricing = (productId: string) =>
  useQuery({
    queryKey: pricingQueryKey(productId),
    queryFn: () => fetchPricing(productId),
  })

/**
 * Drawer that edits one product's regular and sale prices. Used by the product
 * page card and the Prices & sales overview.
 */
export const PricingDrawer = ({
  productId,
  open,
  onOpenChange,
}: {
  productId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) => {
  // Its own query, refetched on every open, so the form never starts from a
  // cached copy that someone has changed since.
  const { data, isFetching } = useQuery({
    queryKey: [...pricingQueryKey(productId ?? ""), "editor"],
    queryFn: () => fetchPricing(productId!),
    enabled: open && !!productId,
    staleTime: 0,
    gcTime: 0,
  })

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <Drawer.Content className="sm:max-w-[680px]">
        <Drawer.Header>
          <Drawer.Title>Price &amp; sale</Drawer.Title>
          {data && (
            <Drawer.Description className="flex items-center gap-x-2">
              {data.pricing.product.title}
              {data.pricing.product.status !== "published" && (
                <Badge size="2xsmall">{data.pricing.product.status}</Badge>
              )}
            </Drawer.Description>
          )}
        </Drawer.Header>
        {isFetching || !data ? (
          <Drawer.Body className="flex flex-col gap-y-3">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </Drawer.Body>
        ) : (
          // Keyed by product so switching products resets the form.
          <Editor
            key={data.pricing.product.id}
            pricing={data.pricing}
            onDone={() => onOpenChange(false)}
          />
        )}
      </Drawer.Content>
    </Drawer>
  )
}
