import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { AdminProduct, DetailWidgetProps } from "@medusajs/framework/types"
import { PencilSquare } from "@medusajs/icons"
import {
  Badge,
  Button,
  Container,
  Heading,
  Skeleton,
  StatusBadge,
  Text,
} from "@medusajs/ui"
import { useState } from "react"
import { Link } from "react-router-dom"
import {
  formatRange,
  percentOff,
  SALE_STATE_COLOR,
  SALE_STATE_LABEL,
  salePeriodText,
} from "../components/pricing/money"
import { PricingDrawer, usePricing } from "../components/pricing/pricing-editor"
import type { AmountRange } from "../components/pricing/types"

const rangeOf = (values: (number | null)[]): AmountRange | null => {
  const present = values.filter((value): value is number => value !== null)
  return present.length
    ? { min: Math.min(...present), max: Math.max(...present) }
    : null
}

// "Price & sale" card at the top of the product page's side column: the
// regular price, the sale price and its period at a glance, and the editor.
const ProductPricingWidget = ({ data: product }: DetailWidgetProps<AdminProduct>) => {
  const [open, setOpen] = useState(false)
  const { data, isLoading } = usePricing(product.id)
  const pricing = data?.pricing

  const base = pricing ? rangeOf(pricing.variants.map((v) => v.base_amount)) : null
  const sale = pricing ? rangeOf(pricing.variants.map((v) => v.sale_amount)) : null
  const missing = pricing?.variants.filter((v) => v.base_amount === null).length ?? 0
  const bestDiscount = pricing
    ? Math.max(
        0,
        ...pricing.variants.map((v) =>
          v.base_amount !== null && v.sale_amount !== null
            ? percentOff(v.base_amount, v.sale_amount)
            : 0
        )
      )
    : 0

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Price &amp; sale</Heading>
        <Button size="small" variant="secondary" onClick={() => setOpen(true)}>
          <PencilSquare />
          Edit
        </Button>
      </div>

      <div className="flex flex-col gap-y-3 px-6 py-4">
        {isLoading || !pricing ? (
          <>
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </>
        ) : (
          <>
            <div className="flex flex-col gap-y-1">
              <Text size="xsmall" className="text-ui-fg-muted">
                Regular price
              </Text>
              <Text
                size="small"
                weight="plus"
                className={
                  pricing.sale?.state === "live" ? "text-ui-fg-muted line-through" : undefined
                }
              >
                {base ? formatRange(base, pricing.currency_code) : "Not set"}
              </Text>
            </div>

            {pricing.sale && sale ? (
              <div className="flex flex-col gap-y-1">
                <div className="flex items-center gap-x-2">
                  <Text size="xsmall" className="text-ui-fg-muted">
                    Sale price
                  </Text>
                  <StatusBadge color={SALE_STATE_COLOR[pricing.sale.state]}>
                    {SALE_STATE_LABEL[pricing.sale.state]}
                  </StatusBadge>
                </div>
                <div className="flex items-center gap-x-2">
                  <Text size="small" weight="plus" className="text-ui-fg-error">
                    {formatRange(sale, pricing.currency_code)}
                  </Text>
                  {bestDiscount > 0 && (
                    <Badge size="2xsmall" color="red">
                      up to -{bestDiscount}%
                    </Badge>
                  )}
                </div>
                <Text size="xsmall" className="text-ui-fg-subtle">
                  {salePeriodText(pricing.sale)}
                </Text>
              </div>
            ) : (
              <Text size="small" className="text-ui-fg-subtle">
                Not on sale.
              </Text>
            )}

            {missing > 0 && (
              <Text size="xsmall" className="text-ui-fg-error">
                {missing} variant(s) have no price and cannot be bought.
              </Text>
            )}
            {pricing.legacy_compare_at !== null && (
              <Text size="xsmall" className="text-ui-tag-orange-text">
                Shows an old display-only &quot;was&quot; price. Open Edit to convert it into a
                real sale.
              </Text>
            )}
            {pricing.other_price_lists.length > 0 && (
              <Text size="xsmall" className="text-ui-fg-subtle">
                Also in {pricing.other_price_lists.length} other price list(s).
              </Text>
            )}
          </>
        )}
      </div>

      <div className="px-6 py-3">
        <Link to="/pricing" className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover txt-compact-small">
          All product prices
        </Link>
      </div>

      <PricingDrawer productId={product.id} open={open} onOpenChange={setOpen} />
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.side.before",
})

export default ProductPricingWidget
