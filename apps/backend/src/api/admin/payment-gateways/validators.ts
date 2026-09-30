import { z } from "@medusajs/framework/zod"
import {
  GATEWAY_ENVIRONMENTS,
  GATEWAY_PROVIDERS,
} from "../../../modules/payment-gateway/types"

// "" clears an optional text field.
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((value) => (value ? value : null))

// A storefront path ("/{country_code}/...") or a full http(s) URL.
const redirectUrl = z
  .string()
  .trim()
  .max(2000)
  .refine(
    (value) => value === "" || value.startsWith("/") || /^https?:\/\/\S+$/i.test(value),
    "Use a path that starts with / or a full http(s) URL"
  )
  .nullish()
  .transform((value) => (value ? value : null))

const notificationUrl = z
  .string()
  .trim()
  .max(2000)
  .refine((value) => value === "" || /^https?:\/\/\S+$/i.test(value), "Use a full http(s) URL")
  .nullish()
  .transform((value) => (value ? value : null))

const fields = {
  name: z.string().trim().min(1).max(80),
  description: optionalText(300),
  environment: z.enum(GATEWAY_ENVIRONMENTS),
  is_active: z.boolean(),
  rank: z.number().int().min(0).max(9999),
  payment_methods: z
    .array(z.string().trim().regex(/^[A-Za-z0-9_]+$/).max(60))
    .max(40)
    .nullish(),
  expiry_minutes: z.number().int().min(5).max(60 * 24 * 30),
  success_url: redirectUrl,
  pending_url: redirectUrl,
  failure_url: redirectUrl,
  notification_url: notificationUrl,
  // Plain text off the wire; secrets are encrypted before they are stored. A
  // blank secret keeps the saved one.
  credentials: z.record(z.string(), z.string().max(500).nullable()),
  sales_channel_ids: z.array(z.string().min(1)).max(100),
}

const optionalFields = z.object(fields).partial()

export const CreatePaymentGatewaySchema = optionalFields.extend({
  name: fields.name,
  provider: z.enum(GATEWAY_PROVIDERS),
})

export const UpdatePaymentGatewaySchema = optionalFields

export type CreatePaymentGatewayBody = z.infer<typeof CreatePaymentGatewaySchema>
export type UpdatePaymentGatewayBody = z.infer<typeof UpdatePaymentGatewaySchema>
