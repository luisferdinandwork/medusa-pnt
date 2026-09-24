"use server"

import { redirect } from "next/navigation"
import { sdk } from "@/lib/sdk"
import { removeAuthToken, removeCartId, setAuthToken } from "@/lib/cookies"
import { safeNext } from "@/lib/format"

export type FormState = { error?: string } | null

async function loginToken(email: string, password: string) {
  const result = await sdk.auth.login("customer", "emailpass", { email, password })
  if (typeof result !== "string") {
    throw new Error("Metode login ini tidak didukung.")
  }
  return result
}

export async function login(_: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim()
  const password = String(formData.get("password") ?? "")
  if (!email || !password) return { error: "Email dan kata sandi wajib diisi." }

  try {
    await setAuthToken(await loginToken(email, password))
  } catch {
    return { error: "Email atau kata sandi salah." }
  }
  redirect(safeNext(formData.get("next")))
}

export async function register(_: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim()
  const password = String(formData.get("password") ?? "")
  if (password.length < 8) return { error: "Kata sandi minimal 8 karakter." }

  try {
    const registerToken = await sdk.auth.register("customer", "emailpass", {
      email,
      password,
    })

    await sdk.store.customer.create(
      {
        email,
        first_name: String(formData.get("first_name") ?? ""),
        last_name: String(formData.get("last_name") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        company_name: String(formData.get("company_name") ?? ""),
      },
      {},
      { authorization: `Bearer ${registerToken}` }
    )

    // The register token has no customer attached yet; log in for a customer-bound one.
    await setAuthToken(await loginToken(email, password))
  } catch (error) {
    const message = error instanceof Error ? error.message : ""
    return {
      error: message.includes("already exists")
        ? "Email ini sudah terdaftar. Silakan masuk."
        : "Pendaftaran gagal. Periksa data Anda lalu coba lagi.",
    }
  }
  redirect("/")
}

export async function logout() {
  await removeAuthToken()
  await removeCartId()
  redirect("/masuk")
}
