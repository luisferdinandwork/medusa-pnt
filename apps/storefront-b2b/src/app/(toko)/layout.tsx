import { AnnouncementBar } from "@/components/announcement-bar"
import { Nav } from "@/components/nav"
import { requireCustomer } from "@/lib/data/customer"
import { getStoreConfig } from "@/lib/store-config"

// Every page in this group needs a valid customer session.
export default async function TokoLayout({ children }: { children: React.ReactNode }) {
  const [customer, config] = await Promise.all([requireCustomer(), getStoreConfig()])
  const name = customer.company_name || customer.first_name || "Akun"

  return (
    <>
      <AnnouncementBar />
      <Nav name={name} />
      <main className="container-page py-8">{children}</main>
      <footer className="border-t border-paper-200 py-8 text-center text-xs text-ink-500">
        &copy; {new Date().getFullYear()} {config.name}. Harga belum termasuk ongkos kirim.
      </footer>
    </>
  )
}
