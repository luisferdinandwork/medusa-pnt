import type { InferTypeOf } from "@medusajs/framework/types"
import PaymentGateway from "../../modules/payment-gateway/models/payment-gateway"
import type { StoredCredentials } from "../../modules/payment-gateway/types"
import type { GatewayClient } from "./common"
import { readCredentials } from "./credentials"
import { dokuClient } from "./doku"
import { midtransClient } from "./midtrans"

export type GatewayRecord = InferTypeOf<typeof PaymentGateway>

/** An API client for the gateway's merchant account (decrypts its keys). */
export const gatewayClient = (gateway: GatewayRecord): GatewayClient => {
  const credentials = readCredentials(
    gateway.provider,
    gateway.credentials as StoredCredentials | null,
    gateway.name
  )
  switch (gateway.provider) {
    case "midtrans":
      return midtransClient({
        environment: gateway.environment,
        serverKey: credentials.server_key,
      })
    case "doku":
      return dokuClient({
        environment: gateway.environment,
        clientId: credentials.client_id,
        secretKey: credentials.secret_key,
      })
  }
}
