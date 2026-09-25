import { Fragment } from "react"

/**
 * A small Markdown renderer for editorial content written in the admin.
 * Supports the subset an editor actually uses: ## and ### headings, ordered and
 * unordered lists, blockquotes, pipe tables, and inline **bold**, *italic*,
 * `code` and [links](url). Output is React elements, never raw HTML.
 */

const INLINE = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g

export function renderInline(text: string, keyPrefix = "") {
  const parts = text.split(INLINE).map((part, index) => {
    const key = `${keyPrefix}-${index}`

    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={key} className="font-semibold text-ink">
          {part.slice(2, -2)}
        </strong>
      )
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code
          key={key}
          className="bg-paper-100 rounded-base px-1 py-0.5 text-[0.9em]"
        >
          {part.slice(1, -1)}
        </code>
      )
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return (
        <em key={key} className="italic">
          {part.slice(1, -1)}
        </em>
      )
    }

    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part)
    if (link) {
      const isExternal = /^https?:\/\//.test(link[2])
      return (
        <a
          key={key}
          href={link[2]}
          className="text-red-500 underline underline-offset-4 hover:text-red-600"
          {...(isExternal
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
        >
          {link[1]}
        </a>
      )
    }

    return <Fragment key={key}>{part}</Fragment>
  })

  return <>{parts}</>
}

type Block =
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "quote"; text: string }
  | { type: "table"; head: string[]; rows: string[][] }

const splitRow = (line: string) =>
  line
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((cell) => cell.trim())

const isDivider = (line: string) => /^\|?[\s:-]*-[\s|:-]*\|?$/.test(line)

function parse(markdown: string): Block[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n")
  const blocks: Block[] = []
  let paragraph: string[] = []

  const flush = () => {
    if (paragraph.length) {
      blocks.push({ type: "paragraph", text: paragraph.join(" ") })
      paragraph = []
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    if (trimmed === "") {
      flush()
      continue
    }

    const heading = /^(#{2,3})\s+(.*)$/.exec(trimmed)
    if (heading) {
      flush()
      blocks.push({
        type: "heading",
        level: heading[1].length === 2 ? 2 : 3,
        text: heading[2],
      })
      continue
    }

    if (trimmed.startsWith(">")) {
      flush()
      const quote: string[] = []
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quote.push(lines[i].trim().replace(/^>\s?/, ""))
        i++
      }
      i--
      blocks.push({ type: "quote", text: quote.join(" ") })
      continue
    }

    if (trimmed.startsWith("|") && isDivider(lines[i + 1]?.trim() ?? "")) {
      flush()
      const head = splitRow(trimmed)
      const rows: string[][] = []
      i += 2
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        rows.push(splitRow(lines[i].trim()))
        i++
      }
      i--
      blocks.push({ type: "table", head, rows })
      continue
    }

    const bullet = /^[-*]\s+(.*)$/.exec(trimmed)
    const numbered = /^\d+\.\s+(.*)$/.exec(trimmed)
    if (bullet || numbered) {
      flush()
      const ordered = Boolean(numbered)
      const items: string[] = []
      while (i < lines.length) {
        const entry = lines[i].trim()
        const match = ordered
          ? /^\d+\.\s+(.*)$/.exec(entry)
          : /^[-*]\s+(.*)$/.exec(entry)
        if (!match) {
          break
        }
        items.push(match[1])
        i++
      }
      i--
      blocks.push({ type: "list", ordered, items })
      continue
    }

    paragraph.push(trimmed)
  }

  flush()
  return blocks
}

export function Markdown({ content }: { content: string }) {
  const blocks = parse(content)

  return (
    <div className="flex flex-col gap-y-5">
      {blocks.map((block, index) => {
        const key = `block-${index}`

        switch (block.type) {
          case "heading":
            return block.level === 2 ? (
              <h2
                key={key}
                className="font-display uppercase text-2xl small:text-3xl leading-tight mt-6 first:mt-0"
              >
                {renderInline(block.text, key)}
              </h2>
            ) : (
              <h3
                key={key}
                className="font-semibold text-lg mt-3 tracking-tight"
              >
                {renderInline(block.text, key)}
              </h3>
            )

          case "list":
            return block.ordered ? (
              <ol
                key={key}
                className="flex flex-col gap-y-2 list-decimal pl-5 marker:text-red-500 marker:font-semibold"
              >
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="text-ink-500 leading-relaxed">
                    {renderInline(item, `${key}-${itemIndex}`)}
                  </li>
                ))}
              </ol>
            ) : (
              <ul key={key} className="flex flex-col gap-y-2">
                {block.items.map((item, itemIndex) => (
                  <li
                    key={itemIndex}
                    className="text-ink-500 leading-relaxed flex gap-x-3"
                  >
                    <span
                      aria-hidden
                      className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500"
                    />
                    <span>{renderInline(item, `${key}-${itemIndex}`)}</span>
                  </li>
                ))}
              </ul>
            )

          case "quote":
            return (
              <blockquote
                key={key}
                className="border-l-2 border-red-500 pl-5 py-1 font-display uppercase text-lg small:text-xl leading-snug"
              >
                {renderInline(block.text, key)}
              </blockquote>
            )

          case "table":
            return (
              <div key={key} className="overflow-x-auto">
                <table className="w-full text-small-regular border-collapse">
                  <thead>
                    <tr className="border-b border-paper-200">
                      {block.head.map((cell, cellIndex) => (
                        <th
                          key={cellIndex}
                          className="text-left py-2 pr-4 text-xs font-semibold uppercase tracking-widest text-ink-500"
                        >
                          {renderInline(cell, `${key}-h-${cellIndex}`)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, rowIndex) => (
                      <tr
                        key={rowIndex}
                        className="border-b border-paper-100 last:border-0"
                      >
                        {row.map((cell, cellIndex) => (
                          <td
                            key={cellIndex}
                            className="py-2 pr-4 align-top text-ink-500"
                          >
                            {renderInline(cell, `${key}-${rowIndex}-${cellIndex}`)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )

          default:
            return (
              <p key={key} className="text-ink-500 leading-relaxed">
                {renderInline(block.text, key)}
              </p>
            )
        }
      })}
    </div>
  )
}

/** Plain text of a Markdown string, for meta descriptions and JSON-LD. */
export const stripMarkdown = (markdown: string) =>
  markdown
    .replace(/```[\s\S]*?```/g, "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[>\-*]\s+/gm, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*`_]/g, "")
    .replace(/\s+/g, " ")
    .trim()
