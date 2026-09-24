"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { sdk } from "@/lib/sdk"
import { getAuthHeaders, getCartId, removeCartId } from "@/lib/cookies"
import { getCart, getOrCreateCart } from "@/lib/data/cart"
import { getCustomer } from "@/lib/data/customer"
import { isAddressDone, isPaymentDone, isShippingDone, isSupportedProvider } from "@/lib/checkout"
import type { FormState } from "./auth"

const refresh = () => revalidatePath("/", "layout")

// Medusa returns a JSON body with a human-readable message; fall back otherwise.
function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? `${fallback} (${error.message})` : fallback
}

export async function addToCart(variantId: string, quantity: number): Promise<FormState> {
  if (!Number.isInteger(quantity) || quantity < 1) {
    return { error: "Jumlah minimal 1." }
  }
  try {
    const cart = await getOrCreateCart()
    await sdk.store.cart.createLineItem(
      cart.id,
      { variant_id: variantId, quantity },
      {},
      await getAuthHeaders()
    )
  } catch {
    return { error: "Gagal menambah ke keranjang. Stok mungkin tidak mencukupi." }
  }
  refresh()
  return null
}

export async function updateItem(formData: FormData) {
  const cartId = await getCartId()
  const lineId = String(formData.get("line_id") ?? "")
  const quantity = Number(formData.get("quantity"))
  if (!cartId || !lineId || !Number.isInteger(quantity)) return

  const headers = await getAuthHeaders()
  if (quantity < 1) {
    await sdk.store.cart.deleteLineItem(cartId, lineId, {}, headers).catch(() => {})
  } else {
    await sdk.store.cart.updateLineItem(cartId, lineId, { quantity }, {}, headers).catch(() => {})
  }
  refresh()
}

export async function removeItem(formData: FormData) {
  const cartId = await getCartId()
  const lineId = String(formData.get("line_id") ?? "")
  if (!cartId || !lineId) return
  await sdk.store.cart
    .deleteLineItem(cartId, lineId, {}, await getAuthHeaders())
    .catch(() => {})
  refresh()
}

// ---- Promo codes -----------------------------------------------------------

export async function applyPromoCode(_: FormState, formData: FormData): Promise<FormState> {
  const code = String(formData.get("code") ?? "").trim()
  if (!code) return { error: "Masukkan kode promo." }

  const cart = await getCart()
  if (!cart) return { error: "Keranjang tidak ditemukan." }

  const existing = (cart.promotions ?? []).map((p) => p.code).filter((c): c is string => !!c)
  if (existing.some((c) => c.toLowerCase() === code.toLowerCase())) {
    return { error: "Kode promo ini sudah dipakai." }
  }

  try {
    const { cart: updated } = await sdk.store.cart.update(
      cart.id,
      { promo_codes: [...existing, code] },
      { fields: "*promotions" },
      await getAuthHeaders()
    )
    const applied = (updated.promotions ?? []).some(
      (p) => p.code?.toLowerCase() === code.toLowerCase()
    )
    if (!applied) return { error: "Kode promo tidak valid atau tidak berlaku untuk keranjang ini." }
  } catch {
    return { error: "Kode promo tidak valid atau tidak berlaku untuk keranjang ini." }
  }

  refresh()
  return null
}

export async function removePromoCode(formData: FormData) {
  const removed = String(formData.get("code") ?? "")
  const cart = await getCart()
  if (!cart || !removed) return

  const remaining = (cart.promotions ?? [])
    .map((p) => p.code)
    .filter((c): c is string => !!c && c !== removed)

  await sdk.store.cart
    .update(cart.id, { promo_codes: remaining }, {}, await getAuthHeaders())
    .catch(() => {})
  refresh()
}

// ---- Checkout steps --------------------------------------------------------

const ADDRESS_FIELDS = [
  "first_name",
  "last_name",
  "company",
  "phone",
  "address_1",
  "province",
  "city",
  "postal_code",
] as const

function readAddress(formData: FormData, prefix: string) {
  const value = (name: string) => String(formData.get(`${prefix}.${name}`) ?? "").trim()
  return {
    first_name: value("first_name"),
    last_name: value("last_name"),
    company: value("company"),
    phone: value("phone"),
    address_1: value("address_1"),
    address_2: "",
    province: value("province"),
    city: value("city"),
    postal_code: value("postal_code"),
    country_code: "id",
  }
}

function isComplete(address: ReturnType<typeof readAddress>) {
  return ADDRESS_FIELDS.filter((f) => f !== "company").every((f) => address[f])
}

export async function setAddresses(_: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim()
  const shipping = readAddress(formData, "shipping_address")
  const sameAsBilling = formData.get("same_as_billing") === "on"
  const billing = sameAsBilling ? shipping : readAddress(formData, "billing_address")

  if (!email) return { error: "Email wajib diisi." }
  if (!isComplete(shipping)) return { error: "Lengkapi seluruh alamat pengiriman." }
  if (!isComplete(billing)) return { error: "Lengkapi seluruh alamat penagihan." }

  const cartId = await getCartId()
  if (!cartId) return { error: "Keranjang tidak ditemukan." }

  const headers = await getAuthHeaders()
  try {
    await sdk.store.cart.update(
      cartId,
      { email, shipping_address: shipping, billing_address: billing },
      {},
      headers
    )
  } catch (error) {
    return { error: errorMessage(error, "Gagal menyimpan alamat.") }
  }

  // Optional: keep the address in the customer's address book for next time.
  if (formData.get("save_address") === "on") {
    await sdk.store.customer.createAddress(shipping, {}, headers).catch(() => {})
  }

  refresh()
  redirect("/checkout?step=pengiriman")
}

export async function setShippingMethod(_: FormState, formData: FormData): Promise<FormState> {
  const optionId = String(formData.get("option_id") ?? "")
  if (!optionId) return { error: "Pilih metode pengiriman." }

  const cartId = await getCartId()
  if (!cartId) return { error: "Keranjang tidak ditemukan." }

  try {
    await sdk.store.cart.addShippingMethod(cartId, { option_id: optionId }, {}, await getAuthHeaders())
  } catch (error) {
    return { error: errorMessage(error, "Metode pengiriman tidak dapat dipilih.") }
  }

  refresh()
  redirect("/checkout?step=pembayaran")
}

export async function setPaymentMethod(_: FormState, formData: FormData): Promise<FormState> {
  const providerId = String(formData.get("provider_id") ?? "")
  if (!providerId || !isSupportedProvider(providerId)) {
    return { error: "Pilih metode pembayaran." }
  }

  const cart = await getCart()
  if (!cart) return { error: "Keranjang tidak ditemukan." }

  try {
    await sdk.store.payment.initiatePaymentSession(
      cart,
      { provider_id: providerId },
      {},
      await getAuthHeaders()
    )
  } catch (error) {
    return { error: errorMessage(error, "Metode pembayaran tidak dapat digunakan.") }
  }

  refresh()
  redirect("/checkout?step=tinjau")
}

// Completes the cart. Orders use the region's manual payment provider: the
// buyer is invoiced and pays by bank transfer, which is the usual B2B flow.
export async function placeOrder(_: FormState, __: FormData): Promise<FormState> {
  const cart = await getCart()
  const customer = await getCustomer()
  if (!cart || !customer || !cart.items?.length) {
    return { error: "Keranjang kosong atau sesi Anda telah berakhir." }
  }
  if (!isAddressDone(cart) || !isShippingDone(cart) || !isPaymentDone(cart)) {
    redirect("/checkout")
  }

  let orderId: string
  try {
    const result = await sdk.store.cart.complete(cart.id, {}, await getAuthHeaders())
    if (result.type !== "order") {
      return { error: result.error?.message ?? "Pesanan belum dapat diselesaikan. Periksa stok dan coba lagi." }
    }
    orderId = result.order.id
  } catch (error) {
    return { error: errorMessage(error, "Terjadi kesalahan saat membuat pesanan.") }
  }

  await removeCartId()
  refresh()
  redirect(`/pesanan/${orderId}?baru=1`)
}
