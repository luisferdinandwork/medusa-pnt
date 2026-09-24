import { Brand } from "@/components/brand"
import { getStoreConfig } from "@/lib/store-config"

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const config = await getStoreConfig()

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <p className="mb-8 text-center font-display text-4xl uppercase tracking-tight">
          <Brand name={config.shortName} />
        </p>
        <div className="rounded-lg border border-paper-200 bg-white p-6 sm:p-8">{children}</div>
      </div>
    </div>
  )
}
