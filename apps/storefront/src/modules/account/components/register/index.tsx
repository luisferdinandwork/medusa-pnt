"use client"

import { useActionState } from "react"
import Input from "@modules/common/components/input"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { signup } from "@lib/data/customer"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
  storeShortName: string
}

const Register = ({ setCurrentView, storeShortName }: Props) => {
  const [message, formAction] = useActionState(signup, null)

  return (
    <div
      className="max-w-sm flex flex-col items-center"
      data-testid="register-page"
    >
      <h1 className="font-display uppercase text-large-semi mb-6">
        Gabung Jadi Member {storeShortName}
      </h1>
      <p className="text-center text-base-regular text-ink-500 mb-4">
        Buat profil member {storeShortName} dan dapatkan akses ke
        pengalaman belanja yang lebih baik.
      </p>
      {message?.state === "verification_required" && (
        <div
          className="w-full mb-4 text-center text-base-regular text-ink bg-paper-100 border border-paper-200 rounded-rounded p-4"
          data-testid="register-verification-message"
        >
          Kami mengirim tautan verifikasi ke <strong>{message.email}</strong>.
          Cek kotak masuk kamu untuk verifikasi email, lalu masuk.
        </div>
      )}
      <form className="w-full flex flex-col" action={formAction}>
        <div className="flex flex-col w-full gap-y-2">
          <Input
            label="Nama depan"
            name="first_name"
            required
            autoComplete="given-name"
            data-testid="first-name-input"
          />
          <Input
            label="Nama belakang"
            name="last_name"
            required
            autoComplete="family-name"
            data-testid="last-name-input"
          />
          <Input
            label="Email"
            name="email"
            required
            type="email"
            autoComplete="email"
            data-testid="email-input"
          />
          <Input
            label="Nomor telepon"
            name="phone"
            type="tel"
            autoComplete="tel"
            data-testid="phone-input"
          />
          <Input
            label="Kata sandi"
            name="password"
            required
            type="password"
            autoComplete="new-password"
            data-testid="password-input"
          />
        </div>
        <ErrorMessage
          error={message?.state === "error" ? message.error : null}
          data-testid="register-error"
        />
        <span className="text-center text-ink-500 text-small-regular mt-6">
          Dengan membuat akun, kamu menyetujui{" "}
          <LocalizedClientLink
            href="/content/privacy-policy"
            className="underline"
          >
            Kebijakan Privasi
          </LocalizedClientLink>{" "}
          dan{" "}
          <LocalizedClientLink
            href="/content/terms-of-use"
            className="underline"
          >
            Syarat &amp; Ketentuan
          </LocalizedClientLink>{" "}
          {storeShortName}.
        </span>
        <SubmitButton className="w-full mt-6" data-testid="register-button">
          Daftar
        </SubmitButton>
      </form>
      <span className="text-center text-ink-500 text-small-regular mt-6">
        Sudah jadi member?{" "}
        <button
          onClick={() => setCurrentView(LOGIN_VIEW.SIGN_IN)}
          className="underline"
        >
          Masuk
        </button>
        .
      </span>
    </div>
  )
}

export default Register
