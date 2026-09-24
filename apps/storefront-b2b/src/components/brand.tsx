// "SPECS B2B" renders with the last word highlighted, like the SPECS wordmark.
export function Brand({ name }: { name: string }) {
  const words = name.trim().split(/\s+/)
  const last = words.length > 1 ? words.pop() : null

  return (
    <>
      {words.join(" ")}
      {last && <span className="text-brand"> {last}</span>}
    </>
  )
}
