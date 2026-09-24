import { Button, Text } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const SignInPrompt = () => {
  return (
    <div className="bg-paper-100 border border-paper-200 rounded-large px-6 py-4 flex items-center justify-between">
      <div>
        <h2 className="font-display uppercase text-lg">Sudah punya akun?</h2>
        <Text className="txt-medium text-ink-500 mt-1">
          Masuk untuk pengalaman belanja yang lebih baik.
        </Text>
      </div>
      <div>
        <LocalizedClientLink href="/account">
          <Button variant="secondary" className="h-10" data-testid="sign-in-button">
            Masuk
          </Button>
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default SignInPrompt
