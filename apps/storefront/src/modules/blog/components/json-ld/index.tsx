/**
 * Structured data. Search engines use it for rich results, and answer engines
 * use it to decide what a page actually claims - which is most of what "GEO"
 * comes down to in practice.
 */
export default function JsonLd({ data }: { data: Record<string, unknown>[] }) {
  return (
    <>
      {data.map((entry, index) => (
        <script
          key={index}
          type="application/ld+json"
          // Server-rendered from our own database, never from user input.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(entry) }}
        />
      ))}
    </>
  )
}
