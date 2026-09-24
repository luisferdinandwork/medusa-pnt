// Maps seeded color option labels to a swatch color for the storefront's
// filter UI. Falls back to a plain text pill when a label isn't in the map.
const COLOR_SWATCHES: Record<string, string> = {
  "Hitam/Merah": "linear-gradient(135deg, #141210 50%, #E8412B 50%)",
  "Putih/Hitam": "linear-gradient(135deg, #F5F3EE 50%, #141210 50%)",
  Navy: "#1B2A4A",
  Hitam: "#141210",
  Putih: "#F5F3EE",
  Merah: "#E8412B",
}

export function getColorSwatch(label: string): string | undefined {
  return COLOR_SWATCHES[label]
}
