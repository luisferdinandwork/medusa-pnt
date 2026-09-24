import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  createApiKeysWorkflow,
  createSalesChannelsWorkflow,
  linkProductsToSalesChannelWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
} from "@medusajs/medusa/core-flows"

const CHANNEL_NAME = "SPECS B2B"
const KEY_TITLE = "SPECS B2B Publishable Key"

// Adds the B2B storefront's sales channel and publishable key
// on top of an already seeded database. Safe to re-run: every step looks for
// an existing record first, and re-running also picks up newly added products.
export default async function seedB2b({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: channels } = await query.graph({
    entity: "sales_channel",
    fields: ["id"],
    filters: { name: CHANNEL_NAME },
  })

  let channelId = channels[0]?.id
  if (!channelId) {
    logger.info(`Creating sales channel "${CHANNEL_NAME}"...`)
    const {
      result: [channel],
    } = await createSalesChannelsWorkflow(container).run({
      input: {
        salesChannelsData: [
          {
            name: CHANNEL_NAME,
            description: "Toko grosir untuk reseller dan mitra bisnis",
          },
        ],
      },
    })
    channelId = channel.id
  }

  const { data: keys } = await query.graph({
    entity: "api_key",
    fields: ["id", "token"],
    filters: { title: KEY_TITLE },
  })

  let key: { id: string; token: string } | undefined = keys[0]
  if (!key) {
    logger.info(`Creating publishable key "${KEY_TITLE}"...`)
    const {
      result: [created],
    } = await createApiKeysWorkflow(container).run({
      input: {
        api_keys: [{ title: KEY_TITLE, type: "publishable", created_by: "" }],
      },
    })
    key = { id: created.id, token: created.token }
    await linkSalesChannelsToApiKeyWorkflow(container).run({
      input: { id: created.id, add: [channelId] },
    })
  }

  const { data: stockLocations } = await query.graph({
    entity: "stock_location",
    fields: ["id", "sales_channels.id"],
  })
  for (const location of stockLocations) {
    const linked = location.sales_channels?.some((sc) => sc?.id === channelId)
    if (!linked) {
      await linkSalesChannelsToStockLocationWorkflow(container).run({
        input: { id: location.id, add: [channelId] },
      })
    }
  }

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "sales_channels.id"],
  })
  const unlinked = products
    .filter((p) => !p.sales_channels?.some((sc) => sc?.id === channelId))
    .map((p) => p.id)

  if (unlinked.length) {
    await linkProductsToSalesChannelWorkflow(container).run({
      input: { id: channelId, add: unlinked },
    })
  }
  logger.info(`Linked ${unlinked.length} product(s) to "${CHANNEL_NAME}".`)

  logger.info("=================================================")
  logger.info("SPECS B2B publishable key: " + key.token)
  logger.info(
    "Copy it into apps/storefront-b2b/.env.local as NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY."
  )
  logger.info("=================================================")
}
