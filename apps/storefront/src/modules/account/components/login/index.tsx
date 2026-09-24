import { login } from "@lib/data/customer"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import { useActionState } from "react"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const Login = ({ setCurrentView }: Props) => {
  const [message, formAction] = useActionState(login, null)

  return (
    <div
      className="max-w-sm w-full flex flex-col items-center"
      data-testid="login-page"
    >
      <h1 className="font-display uppercase text-large-semi mb-6">
        Selamat datang kembali
      </h1>
      <p className="text-center text-base-regular text-ink-500 mb-8">
        Masuk untuk pengalaman belanja yang lebih baik.
      </p>
      {message?.state === "verification_required" && (
        <div
          className="w-full mb-6 text-center text-base-regular text-ink bg-paper-100 border border-paper-200 rounded-rounded p-4"
          data-testid="login-verification-message"
        >
          Kami mengirim tautan verifikasi ke <strong>{message.email}</strong>.
          Cek kotak masuk kamu untuk verifikasi email, lalu masuk.
        </div>
      )}
      <form className="w-full" action={formAction}>
        <div className="flex flex-col w-full gap-y-2">
          <Input
            label="Email"
            name="email"
            type="email"
            title="Masukkan alamat email yang valid."
            autoComplete="email"
            required
            data-testid="email-input"
          />
          <Input
            label="Kata sandi"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            data-testid="password-input"
          />
        </div>
        <ErrorMessage
          error={message?.state === "error" ? message.error : null}
          data-testid="login-error-message"
        />
        <SubmitButton data-testid="sign-in-button" className="w-full mt-6">
          Masuk
        </SubmitButton>
      </form>
      <span className="text-center text-ink-500 text-small-regular mt-6">
        Belum jadi member?{" "}
        <button
          onClick={() => setCurrentView(LOGIN_VIEW.REGISTER)}
          className="underline"
          data-testid="register-button"
        >
          Daftar sekarang
        </button>
        .
      </span>
    </div>
  )
}

export default Login
