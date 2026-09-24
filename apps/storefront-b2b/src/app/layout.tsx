import type { Metadata } from "next"
import { Archivo_Black, Inter } from "next/font/google"
import { getStoreConfig } from "@/lib/store-config"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" })
const archivoBlack = Archivo_Black({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
})

export async function generateMetadata(): Promise<Metadata> {
  const config = await getStoreConfig()

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8002"),
    title: { default: config.defaultTitle, template: `%s | ${config.shortName}` },
    description: config.defaultDescription,
    robots: { index: false, follow: false },
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${inter.variable} ${archivoBlack.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  )
}
