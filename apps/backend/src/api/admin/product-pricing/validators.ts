import { z } from "@medusajs/framework/zod"

const amount = z.number().finite().max(1_000_000_000_000)

export const UpdateProductPricingSchema = z.object({
  variants: z
    .array(
      z.object({
        id: z.string().min(1),
        base_amount: amount.min(0).nullish(),
        sale_amount: amount.positive().nullish(),
      })
    )
    .max(500),
  sale_starts_at: z.string().datetime().nullish(),
  sale_ends_at: z.string().datetime().nullish(),
  remove_compare_at: z.boolean().optional(),
})

export type UpdateProductPricingBody = z.infer<typeof UpdateProductPricingSchema>
