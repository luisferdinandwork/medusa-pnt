// Store and warehouse marks for ship-from locations. Drawn inline without
// clip-path ids: the Medusa building icons share `url(#a)`, which clips them
// away when several render on one page.

type LocationKindIconProps = {
  kind: "warehouse" | "store"
  className?: string
}

const LocationKindIcon = ({
  kind,
  className = "h-4 w-4 shrink-0 text-ink-500",
}: LocationKindIconProps) => (
  <svg
    viewBox="0 0 16 16"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    {kind === "store" ? (
      <>
        <path d="M2.5 6.5 3.5 2.5h9l1 4" />
        <path d="M2.5 6.5a1.75 1.75 0 0 0 3.5 0 1.75 1.75 0 0 0 3.5 0 1.75 1.75 0 0 0 3.5 0" />
        <path d="M3.5 8.2v5.3h9V8.2" />
        <path d="M6.75 13.5v-3h2.5v3" />
      </>
    ) : (
      <>
        <path d="M1.5 6 8 2.5 14.5 6v7.5h-13z" />
        <path d="M4.5 13.5V8.5h7v5" />
        <path d="M4.5 11h7" />
      </>
    )}
  </svg>
)

export default LocationKindIcon
