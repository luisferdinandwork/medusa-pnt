import { getStoreConfig } from "@/lib/store-config"

export async function AnnouncementBar() {
  const { announcementItems } = await getStoreConfig()

  if (!announcementItems.length) {
    return null
  }

  return (
    <div className="bg-ink text-white">
      <div className="container-page flex h-9 items-center justify-center gap-x-6 overflow-x-auto text-[11px] font-medium uppercase tracking-wide">
        {announcementItems.map((item, index) => (
          <span key={item} className="flex items-center gap-x-6 whitespace-nowrap">
            {item}
            {index < announcementItems.length - 1 && <span className="text-white/30">|</span>}
          </span>
        ))}
      </div>
    </div>
  )
}
