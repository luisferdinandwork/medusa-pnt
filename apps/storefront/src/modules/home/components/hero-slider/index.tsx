"use client"

import type { Banner } from "@lib/data/banners"
import { clx } from "@modules/common/components/ui"
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import {
  BannerCopy,
  BannerLink,
  BannerPicture,
  BannerShade,
} from "@modules/home/components/banner"
import { NAV_OVERLAY_ATTRIBUTE } from "@modules/layout/components/nav-shell"

const AUTOPLAY_MS = 6000
// How long the track must be still before a scroll counts as finished, for
// browsers without the scrollend event.
const SETTLE_MS = 140

const widthOf = (track: HTMLElement | null) => Math.max(track?.clientWidth ?? 1, 1)
const positionOf = (track: HTMLElement | null) =>
  Math.round((track?.scrollLeft ?? 0) / widthOf(track))
const scrollTrack = (
  track: HTMLElement | null,
  target: number,
  behavior: ScrollBehavior
) => track?.scrollTo({ left: target * widthOf(track), behavior })

const Arrow = ({ direction }: { direction: "prev" | "next" }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
    <path
      d={direction === "prev" ? "M12.5 4.5 7 10l5.5 5.5" : "M7.5 4.5 13 10l-5.5 5.5"}
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const Slide = ({
  slide,
  priority,
  clone,
  label,
}: {
  slide: Banner
  priority: boolean
  clone: boolean
  label: string
}) => (
  <div
    role={clone ? undefined : "group"}
    aria-roledescription={clone ? undefined : "slide"}
    aria-label={clone ? undefined : label}
    aria-hidden={clone || undefined}
    inert={clone}
    className="w-full shrink-0 snap-start"
  >
    <BannerLink
      banner={slide}
      className="group relative block aspect-[4/5] w-full overflow-hidden md:aspect-[32/15] md:max-h-[88vh]"
    >
      <BannerPicture
        banner={slide}
        priority={priority}
        className="transition-transform duration-[1200ms] ease-out group-hover:scale-[1.02]"
      />
      {(slide.title || slide.eyebrow || slide.subtitle) && (
        <BannerShade theme={slide.text_theme} />
      )}
      <div className="absolute inset-0 flex items-end">
        <div className="content-container pb-14 small:pb-20">
          <BannerCopy banner={slide} />
        </div>
      </div>
    </BannerLink>
  </div>
)

/**
 * Full-width slides that swipe on touch (CSS scroll snap), loop endlessly in
 * both directions and advance on their own every few seconds. The loop works
 * with a copy of the last slide before the first and of the first after the
 * last: when a scroll comes to rest on a copy, the track jumps to the real
 * slide without animation, so going "next" from the last slide keeps moving
 * right. Autoplay pauses while the pointer or keyboard focus is on the
 * slider, when the tab is hidden, and for reduced-motion users.
 *
 * The slider sits under the header (which turns transparent over it), so it
 * pulls itself up by the header's height.
 */
export default function HeroSlider({ slides }: { slides: Banner[] }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const settleTimer = useRef<number | undefined>(undefined)
  const count = slides.length
  const loop = count > 1

  // The copies are added after hydration, so the server HTML starts on the
  // first real slide without any scripting.
  const [withClones, setWithClones] = useState(false)
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const offset = withClones ? 1 : 0

  useLayoutEffect(() => {
    if (loop) setWithClones(true)
  }, [loop])

  // Runs before paint once the copies exist: stay on the first real slide.
  useLayoutEffect(() => {
    if (withClones) scrollTrack(trackRef.current, 1, "instant")
  }, [withClones])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const pending = settleTimer

    const settle = () => {
      if (!withClones) return
      const at = positionOf(track)
      if (at === 0) scrollTrack(track, count, "instant")
      else if (at === count + 1) scrollTrack(track, 1, "instant")
    }
    // Last resting position, to restore after a resize changes the width.
    let current = positionOf(track)
    const onScroll = () => {
      current = positionOf(track)
      setActive((((current - offset) % count) + count) % count)
      window.clearTimeout(pending.current)
      pending.current = window.setTimeout(settle, SETTLE_MS)
    }
    // Keep the current slide in place when the width changes.
    const onResize = () => scrollTrack(track, current, "instant")

    track.addEventListener("scroll", onScroll, { passive: true })
    track.addEventListener("scrollend", settle)
    window.addEventListener("resize", onResize)
    return () => {
      track.removeEventListener("scroll", onScroll)
      track.removeEventListener("scrollend", settle)
      window.removeEventListener("resize", onResize)
      window.clearTimeout(pending.current)
    }
  }, [count, offset, withClones])

  const step = useCallback((direction: 1 | -1) => {
    const track = trackRef.current
    scrollTrack(track, positionOf(track) + direction, "smooth")
  }, [])
  const goTo = (index: number) => scrollTrack(trackRef.current, index + offset, "smooth")

  useEffect(() => {
    if (!loop || paused) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const timer = setInterval(() => {
      if (!document.hidden) step(1)
    }, AUTOPLAY_MS)
    return () => clearInterval(timer)
  }, [loop, paused, step])

  const track = withClones ? [slides[count - 1], ...slides, slides[0]] : slides

  return (
    <section
      {...{ [NAV_OVERLAY_ATTRIBUTE]: "" }}
      aria-roledescription="carousel"
      aria-label="Promosi utama"
      className="relative -mt-16 w-full bg-ink"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        ref={trackRef}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
      >
        {track.map((slide, index) => {
          const clone = withClones && (index === 0 || index === count + 1)
          const real = withClones ? index - 1 : index
          return (
            <Slide
              key={clone ? `clone-${index}` : slide.id}
              slide={slide}
              clone={clone}
              priority={!clone && real === 0}
              label={`${real + 1} dari ${count}`}
            />
          )
        })}
      </div>

      {loop && (
        <>
          <div className="pointer-events-none absolute inset-x-0 bottom-5 flex justify-center">
            <div className="pointer-events-auto flex items-center gap-x-2 rounded-full bg-black/25 px-3 py-2 backdrop-blur-sm">
              {slides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  aria-label={`Tampilkan slide ${index + 1}`}
                  aria-current={index === active}
                  onClick={() => goTo(index)}
                  className={clx(
                    "h-1.5 rounded-full transition-all duration-300",
                    index === active ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
                  )}
                />
              ))}
            </div>
          </div>
          <div className="absolute bottom-4 right-6 hidden items-center gap-x-2 small:flex">
            <button
              type="button"
              aria-label="Slide sebelumnya"
              onClick={() => step(-1)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/85 text-ink shadow-sm backdrop-blur transition-colors hover:bg-white"
            >
              <Arrow direction="prev" />
            </button>
            <button
              type="button"
              aria-label="Slide berikutnya"
              onClick={() => step(1)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/85 text-ink shadow-sm backdrop-blur transition-colors hover:bg-white"
            >
              <Arrow direction="next" />
            </button>
          </div>
        </>
      )}
    </section>
  )
}
