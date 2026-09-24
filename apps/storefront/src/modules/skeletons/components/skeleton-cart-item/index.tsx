const SkeletonCartItem = ({ type = "full" }: { type?: "full" | "preview" }) => {
  if (type === "preview") {
    return (
      <div className="flex gap-x-4">
        <div className="w-16 aspect-square shrink-0 rounded-large bg-paper-200 animate-pulse" />
        <div className="flex flex-1 flex-col justify-center gap-y-2">
          <div className="w-2/3 h-3 bg-paper-200 animate-pulse rounded-soft" />
          <div className="w-1/3 h-3 bg-paper-200 animate-pulse rounded-soft" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-x-4 small:gap-x-6 py-6 border-b border-paper-200">
      <div className="w-20 small:w-28 aspect-square shrink-0 rounded-large bg-paper-200 animate-pulse" />
      <div className="flex flex-1 flex-col justify-between gap-y-3">
        <div className="flex flex-col gap-y-2">
          <div className="w-1/2 h-4 bg-paper-200 animate-pulse rounded-soft" />
          <div className="w-1/3 h-3 bg-paper-200 animate-pulse rounded-soft" />
        </div>
        <div className="flex items-center justify-between">
          <div className="w-24 h-9 bg-paper-200 animate-pulse rounded-large" />
          <div className="w-16 h-4 bg-paper-200 animate-pulse rounded-soft" />
        </div>
      </div>
    </div>
  )
}

export default SkeletonCartItem
