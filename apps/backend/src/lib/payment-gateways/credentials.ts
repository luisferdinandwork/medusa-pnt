import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "crypto"
import { MedusaError } from "@medusajs/framework/utils"
import {
  CREDENTIAL_FIELDS,
  type CredentialsPatch,
  type GatewayProvider,
  type StoredCredentials,
  type StoredSecret,
} from "../../modules/payment-gateway/types"

// Gateway secrets (server key, secret key) are stored encrypted with
// AES-256-GCM. The key comes from PAYMENT_GATEWAY_ENCRYPTION_KEY, or
// COOKIE_SECRET when that is not set. Changing it makes the stored secrets
// unreadable: enter them again in the admin afterwards.

const VERSION = "v1"

const encryptionKey = () =>
  createHash("sha256")
    .update(
      process.env.PAYMENT_GATEWAY_ENCRYPTION_KEY ||
        process.env.COOKIE_SECRET ||
        "supersecret"
    )
    .digest()

export const isStoredSecret = (value: unknown): value is StoredSecret =>
  !!value &&
  typeof value === "object" &&
  typeof (value as StoredSecret).enc === "string"

export const encryptSecret = (value: string): StoredSecret => {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv)
  const data = Buffer.concat([cipher.update(value, "utf8"), cipher.final()])
  return {
    enc: [
      VERSION,
      iv.toString("base64"),
      cipher.getAuthTag().toString("base64"),
      data.toString("base64"),
    ].join(":"),
    last4: value.slice(-4),
  }
}

export const decryptSecret = (secret: StoredSecret): string => {
  const [version, iv, tag, data] = secret.enc.split(":")
  if (version !== VERSION || !iv || !tag || !data) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Unknown secret format")
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(iv, "base64")
  )
  decipher.setAuthTag(Buffer.from(tag, "base64"))
  return Buffer.concat([
    decipher.update(Buffer.from(data, "base64")),
    decipher.final(),
  ]).toString("utf8")
}

/**
 * Turns the admin's credential input into a patch: secrets are encrypted,
 * blank secrets keep the stored one, blank public fields clear it. Unknown
 * keys are dropped.
 */
export const toCredentialsPatch = (
  provider: GatewayProvider,
  input: Record<string, string | null | undefined> | undefined
): CredentialsPatch => {
  const patch: CredentialsPatch = {}
  if (!input) {
    return patch
  }
  for (const field of CREDENTIAL_FIELDS[provider]) {
    const raw = input[field.key]
    if (raw === undefined) {
      continue
    }
    const value = (raw ?? "").trim()
    if (field.secret) {
      if (value) {
        patch[field.key] = encryptSecret(value)
      }
      continue
    }
    patch[field.key] = value || null
  }
  return patch
}

export const mergeCredentials = (
  stored: StoredCredentials | null | undefined,
  patch: CredentialsPatch
): StoredCredentials => {
  const merged: StoredCredentials = { ...(stored ?? {}) }
  for (const [key, value] of Object.entries(patch)) {
    if (value === null) {
      delete merged[key]
    } else {
      merged[key] = value
    }
  }
  return merged
}

/** Labels of the required credentials that are still empty. */
export const missingCredentials = (
  provider: GatewayProvider,
  stored: StoredCredentials | null | undefined
) =>
  CREDENTIAL_FIELDS[provider]
    .filter((field) => field.required && !stored?.[field.key])
    .map((field) => field.label)

/** What the admin may see: public values in full, secrets as the last 4. */
export const describeCredentials = (
  provider: GatewayProvider,
  stored: StoredCredentials | null | undefined
) =>
  Object.fromEntries(
    CREDENTIAL_FIELDS[provider].map((field) => {
      const value = stored?.[field.key]
      if (field.secret) {
        return [
          field.key,
          { set: isStoredSecret(value), last4: isStoredSecret(value) ? value.last4 : null },
        ]
      }
      return [field.key, { set: !!value, value: typeof value === "string" ? value : null }]
    })
  )

/** Plain-text credentials for calling the gateway. Throws when one is missing. */
export const readCredentials = (
  provider: GatewayProvider,
  stored: StoredCredentials | null | undefined,
  gatewayName: string
): Record<string, string> => {
  const missing = missingCredentials(provider, stored)
  if (missing.length) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Payment gateway "${gatewayName}" is missing: ${missing.join(", ")}`
    )
  }

  const plain: Record<string, string> = {}
  for (const field of CREDENTIAL_FIELDS[provider]) {
    const value = stored?.[field.key]
    if (!value) {
      continue
    }
    if (!isStoredSecret(value)) {
      plain[field.key] = value
      continue
    }
    try {
      plain[field.key] = decryptSecret(value)
    } catch {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `The ${field.label} of payment gateway "${gatewayName}" can't be decrypted (was PAYMENT_GATEWAY_ENCRYPTION_KEY or COOKIE_SECRET changed?). Enter it again in the admin.`
      )
    }
  }
  return plain
}
