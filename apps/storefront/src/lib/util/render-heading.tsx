import { Fragment } from "react"

// "Line one\n*Highlighted* rest": a newline breaks the line, *word* renders red.
export function renderHeading(heading: string) {
  return heading.split("\n").map((line, lineIndex) => (
    <Fragment key={lineIndex}>
      {lineIndex > 0 && <br />}
      {line.split(/(\*[^*]+\*)/g).map((part, partIndex) =>
        part.startsWith("*") && part.endsWith("*") && part.length > 2 ? (
          <span key={partIndex} className="text-red-500">
            {part.slice(1, -1)}
          </span>
        ) : (
          <Fragment key={partIndex}>{part}</Fragment>
        )
      )}
    </Fragment>
  ))
}
