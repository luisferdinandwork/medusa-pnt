import { getStoreConfig } from "@lib/data/store-config"

export default async function GuideTeaser() {
  const { guideCards } = await getStoreConfig()

  if (!guideCards.length) {
    return null
  }

  return (
    <div className="content-container py-16 small:py-24 border-t border-paper-200">
      <div className="grid grid-cols-1 small:grid-cols-3 gap-10">
        {guideCards.map((guide, index) => (
          <div key={`${guide.title}-${index}`} className="flex flex-col gap-y-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-red-500">
              {String(index + 1).padStart(2, "0")}
              {guide.eyebrow ? ` - ${guide.eyebrow}` : ""}
            </span>
            <h3 className="font-display uppercase text-xl">{guide.title}</h3>
            <p className="text-small-regular text-ink-500">
              {guide.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
