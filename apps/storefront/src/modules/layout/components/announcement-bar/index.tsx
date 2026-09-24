import { getStoreConfig } from "@lib/data/store-config"

export default async function AnnouncementBar() {
  const { announcementItems } = await getStoreConfig()

  if (!announcementItems.length) {
    return null
  }

  return (
    <div className="bg-ink text-white">
      <div className="content-container flex items-center justify-center gap-x-6 h-9 text-[11px] font-medium tracking-wide uppercase overflow-x-auto no-scrollbar">
        {announcementItems.map((item, index) => (
          <span key={item} className="flex items-center gap-x-6 whitespace-nowrap">
            {item}
            {index < announcementItems.length - 1 && (
              <span className="text-white/30">|</span>
            )}
          </span>
        ))}
      </div>
    </div>
  )
}
