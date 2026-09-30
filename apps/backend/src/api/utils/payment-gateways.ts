import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import type { ConfigModule, RemoteQueryFunction } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import paymentGatewaySalesChannelLink from "../../links/payment-gateway-sales-channel"
import {
  describeCredentials,
  missingCredentials,
} from "../../lib/payment-gateways/credentials"
import type { GatewayRecord } from "../../lib/payment-gateways"
import {
  type GatewayProvider,
  gatewayProviderOf,
  PROVIDER_IDS,
  type StoredCredentials,
  webhookPath,
} from "../../modules/payment-gateway/types"

type Query = Omit<RemoteQueryFunction, symbol>

type GatewayWithChannels = GatewayRecord & {
  sales_channels?: ({ id: string; name: string } | null)[] | null
}

/** Query fields for the admin: the gateway and the sales channels it serves. */
export const GATEWAY_QUERY_FIELDS = ["*", "sales_channels.id", "sales_channels.name"]

/** A gateway as the admin sees it: secrets reduced to their last 4 characters. */
export const serializeGateway = (gateway: GatewayWithChannels) => {
  const { credentials, sales_channels, ...rest } = gateway
  const stored = credentials as StoredCredentials | null
  return {
    ...rest,
    provider_id: PROVIDER_IDS[gateway.provider],
    webhook_path: webhookPath(gateway.provider),
    credentials: describeCredentials(gateway.provider, stored),
    missing_credentials: missingCredentials(gateway.provider, stored),
    sales_channels: (sales_channels ?? [])
      .filter((channel): channel is { id: string; name: string } => !!channel)
      .map(({ id, name }) => ({ id, name })),
  }
}

/** Active gateways offered by a sales channel, in checkout order. */
export const listChannelGateways = async (
  query: Query,
  salesChannelIds: string[],
  provider?: GatewayProvider
) => {
  if (!salesChannelIds.length) {
    return []
  }
  const { data } = await query.graph({
    entity: paymentGatewaySalesChannelLink.entryPoint,
    fields: ["payment_gateway.*"],
    filters: { sales_channel_id: salesChannelIds },
  })

  const byId = new Map<string, GatewayRecord>()
  for (const row of data as { payment_gateway?: GatewayRecord | null }[]) {
    const gateway = row.payment_gateway
    if (
      gateway &&
      gateway.is_active &&
      !byId.has(gateway.id) &&
      (!provider || gateway.provider === provider)
    ) {
      byId.set(gateway.id, gateway)
    }
  }
  return [...byId.values()].sort(
    (a, b) => a.rank - b.rank || a.name.localeCompare(b.name)
  )
}

/** What a storefront may know about a gateway (never its keys). */
export const toStoreGateway = (gateway: GatewayRecord) => {
  const credentials = gateway.credentials as StoredCredentials | null
  const clientKey = credentials?.client_key
  return {
    id: gateway.id,
    name: gateway.name,
    description: gateway.description,
    provider: gateway.provider,
    provider_id: PROVIDER_IDS[gateway.provider],
    environment: gateway.environment,
    payment_methods: (gateway.payment_methods as string[] | null) ?? [],
    rank: gateway.rank,
    // Public by design (Snap.js uses it in the browser).
    client_key: typeof clientKey === "string" ? clientKey : null,
  }
}

/**
 * The return URL when its origin is one of the storefront origins in
 * STORE_CORS, otherwise undefined. Keeps the gateway from being told to send
 * shoppers to some other site.
 */
export const allowedReturnUrl = (value: unknown, storeCors: string) => {
  if (typeof value !== "string") {
    return undefined
  }
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return undefined
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return undefined
  }
  const allowed = storeCors
    .split(",")
    .map((entry) => entry.trim().replace(/\/$/, ""))
    .filter(Boolean)
    .some((entry) => {
      if (entry === "*") {
        return true
      }
      if (entry.length > 2 && entry.startsWith("/") && entry.endsWith("/")) {
        try {
          return new RegExp(entry.slice(1, -1)).test(url.origin)
        } catch {
          return false
        }
      }
      return entry === url.origin
    })
  return allowed ? url.toString() : undefined
}

type CartRow = {
  id: string
  email: string | null
  sales_channel_id: string | null
  billing_address?: { first_name?: string | null; last_name?: string | null; phone?: string | null } | null
  shipping_address?: { first_name?: string | null; last_name?: string | null; phone?: string | null } | null
}

/**
 * Runs before POST /store/payment-collections/:id/payment-sessions. For a
 * Midtrans or DOKU session it checks that the gateway is active and offered by
 * the cart's sales channel (picking the first one when the storefront did not
 * name one), checks the return URL, and adds the cart and shopper details the
 * gateway page is filled with. Other providers pass through untouched.
 */
export const assignPaymentGateway = async (
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const body = req.body as { provider_id?: unknown; data?: Record<string, unknown> } | undefined
  const provider = gatewayProviderOf(
    typeof body?.provider_id === "string" ? body.provider_id : undefined
  )
  if (!body || !provider) {
    return next()
  }

  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const config: ConfigModule = req.scope.resolve(ContainerRegistrationKeys.CONFIG_MODULE)
    const input = body.data ?? {}

    const { data: links } = await query.graph({
      entity: "cart_payment_collection",
      fields: ["cart_id"],
      filters: { payment_collection_id: req.params.id },
    })
    const cartId = (links[0] as { cart_id?: string } | undefined)?.cart_id
    if (!cartId) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "This payment collection does not belong to a cart."
      )
    }
    const { data: carts } = await query.graph({
      entity: "cart",
      fields: [
        "id",
        "email",
        "sales_channel_id",
        "billing_address.first_name",
        "billing_address.last_name",
        "billing_address.phone",
        "shipping_address.first_name",
        "shipping_address.last_name",
        "shipping_address.phone",
      ],
      filters: { id: cartId },
    })
    const cart = carts[0] as CartRow | undefined
    if (!cart) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, `Cart ${cartId} not found.`)
    }

    const gateways = await listChannelGateways(
      query,
      cart.sales_channel_id ? [cart.sales_channel_id] : [],
      provider
    )
    const requested = typeof input.gateway_id === "string" ? input.gateway_id : undefined
    const gateway = requested ? gateways.find((item) => item.id === requested) : gateways[0]
    if (!gateway) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Metode pembayaran ini tidak tersedia di toko ini."
      )
    }

    const returnUrl = allowedReturnUrl(input.return_url, config.projectConfig.http.storeCors ?? "")
    if (!returnUrl) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "return_url must be a page of this storefront (its origin must be listed in STORE_CORS)."
      )
    }

    const countryCode =
      typeof input.country_code === "string" && /^[a-z]{2}$/i.test(input.country_code)
        ? input.country_code.toLowerCase()
        : undefined
    const address = cart.billing_address ?? cart.shipping_address

    body.data = {
      gateway_id: gateway.id,
      return_url: returnUrl,
      country_code: countryCode,
      cart_id: cart.id,
      customer: {
        first_name: address?.first_name ?? null,
        last_name: address?.last_name ?? null,
        email: cart.email,
        phone: address?.phone ?? (cart.shipping_address?.phone || null),
      },
    }
    next()
  } catch (error) {
    next(error)
  }
}
