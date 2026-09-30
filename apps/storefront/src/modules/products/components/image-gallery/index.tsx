"use client"

import { Dialog, Transition } from "@headlessui/react"
import { HttpTypes } from "@medusajs/types"
import { ChevronLeftMini, ChevronRightMini, XMark } from "@medusajs/icons"
import { clx, Text } from "@modules/common/components/ui"
import ProductPlaceholder from "@modules/common/icons/product-placeholder"
import Image from "next/image"
import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react"

/** A video from the admin's "Videos" card (`product.metadata.videos`). */
export type ProductVideo = { url: string; alt?: string }

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
  videos?: ProductVideo[]
  title?: string
}

/** One gallery entry: an image, or a video that plays muted on loop. */
type MediaItem = {
  id: string
  kind: "image" | "video"
  url: string
  alt?: string
}

// The first image stays the hero; videos follow it, then the other images.
const toMedia = (
  images: HttpTypes.StoreProductImage[],
  videos: ProductVideo[]
): MediaItem[] => {
  const pictures: MediaItem[] = images
    .filter((image) => !!image.url)
    .map((image) => ({ id: image.id, kind: "image", url: image.url! }))
  const clips: MediaItem[] = videos.map((video, index) => ({
    id: `video-${index}-${video.url}`,
    kind: "video",
    url: video.url,
    alt: video.alt,
  }))
  return [...pictures.slice(0, 1), ...clips, ...pictures.slice(1)]
}

// Muted, looping, inline: the only way browsers autoplay a video.
const LoopingVideo = ({ item, className }: { item: MediaItem; className: string }) => (
  <video
    src={item.url}
    aria-label={item.alt || undefined}
    autoPlay
    muted
    loop
    playsInline
    preload="metadata"
    className={className}
  />
)

const HOVER_SCALE = 2
const VIEWER_SCALE = 2.4
const MOBILE_SCALE = 2.5
const DOUBLE_TAP_MS = 300

type Point = { x: number; y: number }

/** Cursor position inside an element as percentages, for transform-origin. */
const originFrom = (event: React.MouseEvent<HTMLElement>): Point => {
  const rect = event.currentTarget.getBoundingClientRect()
  return {
    x: ((event.clientX - rect.left) / rect.width) * 100,
    y: ((event.clientY - rect.top) / rect.height) * 100,
  }
}

/**
 * Desktop: a two-column grid of every image; hovering zooms into the spot
 * under the cursor and clicking opens the full-screen viewer.
 */
const DesktopGrid = ({
  images,
  title,
  onOpen,
}: {
  images: MediaItem[]
  title: string
  onOpen: (index: number) => void
}) => {
  const [hover, setHover] = useState<{ index: number; origin: Point } | null>(null)
  const single = images.length === 1

  return (
    <div
      className={clx("hidden small:grid gap-1", single ? "grid-cols-1" : "grid-cols-2")}
      data-testid="image-grid"
    >
      {images.map((image, index) => {
        const zoomed = hover?.index === index
        return (
          <button
            key={image.id}
            type="button"
            onClick={() => onOpen(index)}
            onMouseMove={(event) =>
              image.kind === "image" && setHover({ index, origin: originFrom(event) })
            }
            onMouseLeave={() => setHover(null)}
            aria-label={`Lihat ${image.kind === "video" ? "video" : "foto"} ${index + 1} lebih detail`}
            className={clx(
              "relative w-full overflow-hidden border border-paper-200 bg-ui-bg-subtle",
              image.kind === "image" ? "cursor-zoom-in" : "cursor-pointer",
              single ? "aspect-[4/3]" : "aspect-square"
            )}
          >
            {image.kind === "video" ? (
              <LoopingVideo item={image} className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <Image
                src={image.url}
                alt={`${title} - foto ${index + 1}`}
                fill
                priority={index < 2}
                sizes={single ? "70vw" : "35vw"}
                className="object-cover transition-transform duration-200 ease-out"
                style={{
                  transform: zoomed ? `scale(${HOVER_SCALE})` : "scale(1)",
                  transformOrigin: zoomed
                    ? `${hover.origin.x}% ${hover.origin.y}%`
                    : "center",
                }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}

/**
 * Full-screen viewer: one image at a time with arrows, thumbnails and the
 * keyboard (left/right, Escape). Clicking the image zooms in; moving the mouse
 * then pans across it.
 */
const Viewer = ({
  images,
  title,
  index,
  onChange,
  onClose,
}: {
  images: MediaItem[]
  title: string
  index: number | null
  onChange: (index: number) => void
  onClose: () => void
}) => {
  const [zoomed, setZoomed] = useState(false)
  const [origin, setOrigin] = useState<Point>({ x: 50, y: 50 })
  const open = index !== null
  const count = images.length
  const current = open ? images[index] : undefined

  const go = useCallback(
    (step: number) => {
      if (index === null) {
        return
      }
      setZoomed(false)
      onChange((index + step + count) % count)
    },
    [index, count, onChange]
  )

  useEffect(() => {
    if (!open) {
      setZoomed(false)
      return
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") go(1)
      if (event.key === "ArrowLeft") go(-1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, go])

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-[80]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Dialog.Panel
            className="fixed inset-0 flex flex-col bg-white"
            data-testid="image-viewer"
          >
            <div className="flex items-center justify-between px-6 py-4">
              <Dialog.Title className="text-small-regular text-ink-500 tabular-nums">
                {title} · {index !== null ? index + 1 : 0}/{count}
              </Dialog.Title>
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-paper-100 text-ink hover:bg-paper-200"
                data-testid="image-viewer-close"
              >
                <XMark />
              </button>
            </div>

            <div className="relative flex-1 overflow-hidden">
              {current?.kind === "video" && (
                <video
                  key={current.id}
                  src={current.url}
                  aria-label={current.alt || undefined}
                  controls
                  autoPlay
                  playsInline
                  className="absolute inset-0 h-full w-full object-contain"
                  data-testid="image-viewer-video"
                />
              )}
              {current?.kind === "image" && current.url && (
                <button
                  type="button"
                  onClick={(event) => {
                    setOrigin(originFrom(event))
                    setZoomed((value) => !value)
                  }}
                  onMouseMove={(event) => zoomed && setOrigin(originFrom(event))}
                  aria-label={zoomed ? "Perkecil" : "Perbesar"}
                  className={clx(
                    "absolute inset-0",
                    zoomed ? "cursor-zoom-out" : "cursor-zoom-in"
                  )}
                >
                  <Image
                    key={current.id}
                    src={current.url}
                    alt={`${title} - foto ${(index ?? 0) + 1}`}
                    fill
                    sizes="100vw"
                    className="object-contain transition-transform duration-200 ease-out"
                    style={{
                      transform: zoomed ? `scale(${VIEWER_SCALE})` : "scale(1)",
                      transformOrigin: `${origin.x}% ${origin.y}%`,
                    }}
                  />
                </button>
              )}
              {count > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => go(-1)}
                    aria-label="Foto sebelumnya"
                    className="absolute left-6 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink shadow-md hover:bg-paper-100"
                  >
                    <ChevronLeftMini />
                  </button>
                  <button
                    type="button"
                    onClick={() => go(1)}
                    aria-label="Foto berikutnya"
                    className="absolute right-6 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink shadow-md hover:bg-paper-100"
                  >
                    <ChevronRightMini />
                  </button>
                </>
              )}
            </div>

            {count > 1 && (
              <div className="flex justify-center gap-2 overflow-x-auto no-scrollbar px-6 py-4">
                {images.map((image, thumbIndex) => (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => {
                      setZoomed(false)
                      onChange(thumbIndex)
                    }}
                    aria-label={`Foto ${thumbIndex + 1}`}
                    aria-current={thumbIndex === index}
                    className={clx(
                      "relative h-16 w-16 shrink-0 overflow-hidden rounded-rounded border-2 bg-ui-bg-subtle",
                      thumbIndex === index ? "border-ink" : "border-transparent"
                    )}
                  >
                    {image.kind === "video" ? (
                      <>
                        <video src={image.url} muted preload="metadata" className="h-full w-full object-cover" />
                        <span className="absolute inset-0 flex items-center justify-center bg-ink/30 text-[10px] font-semibold uppercase text-white">
                          Video
                        </span>
                      </>
                    ) : (
                      <Image src={image.url} alt="" fill sizes="64px" className="object-cover" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </Dialog.Panel>
        </Transition.Child>
      </Dialog>
    </Transition>
  )
}

/**
 * Mobile: every image in a horizontal strip (the next one peeks in). A double
 * tap zooms into the tapped spot; while zoomed, dragging moves around the
 * image and the strip stays put. Another double tap zooms back out.
 */
const MobileStrip = ({
  images,
  title,
}: {
  images: MediaItem[]
  title: string
}) => {
  const [active, setActive] = useState(0)
  const [zoomed, setZoomed] = useState<number | null>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const panRef = useRef<HTMLDivElement>(null)
  const focus = useRef<Point | null>(null)
  const lastTap = useRef<{ time: number; x: number; y: number } | null>(null)
  const pressStart = useRef<Point | null>(null)
  const single = images.length === 1

  useEffect(() => {
    const track = trackRef.current
    if (!track) {
      return
    }
    const onScroll = () => {
      const slide = track.firstElementChild as HTMLElement | null
      const width = slide?.offsetWidth ?? track.clientWidth
      setActive(Math.min(images.length - 1, Math.round(track.scrollLeft / Math.max(1, width))))
    }
    track.addEventListener("scroll", onScroll, { passive: true })
    return () => track.removeEventListener("scroll", onScroll)
  }, [images.length])

  // Centre the zoomed image on the spot that was tapped.
  useLayoutEffect(() => {
    const pan = panRef.current
    const point = focus.current
    if (zoomed === null || !pan || !point) {
      return
    }
    pan.scrollLeft = point.x * MOBILE_SCALE - pan.clientWidth / 2
    pan.scrollTop = point.y * MOBILE_SCALE - pan.clientHeight / 2
    focus.current = null
  }, [zoomed])

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    pressStart.current = { x: event.clientX, y: event.clientY }
  }

  const onPointerUp = (index: number) => (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = pressStart.current
    // A swipe or a pan is not a tap.
    if (!start || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 10) {
      return
    }
    const now = Date.now()
    // Videos don't zoom; a tap is left to the video itself.
    if (images[index]?.kind === "video") {
      return
    }
    const previous = lastTap.current
    if (
      previous &&
      now - previous.time < DOUBLE_TAP_MS &&
      Math.hypot(event.clientX - previous.x, event.clientY - previous.y) < 40
    ) {
      lastTap.current = null
      if (zoomed === index) {
        setZoomed(null)
      } else {
        const rect = event.currentTarget.getBoundingClientRect()
        focus.current = { x: event.clientX - rect.left, y: event.clientY - rect.top }
        setZoomed(index)
      }
      return
    }
    lastTap.current = { time: now, x: event.clientX, y: event.clientY }
  }

  return (
    <div className="relative small:hidden" data-testid="image-strip">
      <div
        ref={trackRef}
        className={clx(
          "flex gap-1 no-scrollbar [touch-action:manipulation]",
          zoomed === null ? "snap-x snap-mandatory overflow-x-auto" : "overflow-hidden"
        )}
      >
        {images.map((image, index) => (
          <div
            key={image.id}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp(index)}
            className={clx(
              "relative aspect-square shrink-0 snap-start overflow-hidden border border-paper-200 bg-ui-bg-subtle",
              single ? "w-full" : "w-[88%]"
            )}
            data-testid="image-strip-slide"
          >
            {image.kind === "video" ? (
              <LoopingVideo item={image} className="absolute inset-0 h-full w-full object-cover" />
            ) : zoomed === index ? (
              <div
                ref={panRef}
                className="absolute inset-0 overflow-auto overscroll-contain no-scrollbar"
                data-testid="image-strip-zoomed"
              >
                <div
                  className="relative"
                  style={{ width: `${MOBILE_SCALE * 100}%`, height: `${MOBILE_SCALE * 100}%` }}
                >
                  {!!image.url && (
                    <Image
                      src={image.url}
                      alt={`${title} - foto ${index + 1}`}
                      fill
                      sizes="250vw"
                      className="object-cover"
                    />
                  )}
                </div>
              </div>
            ) : (
              !!image.url && (
                <Image
                  src={image.url}
                  alt={`${title} - foto ${index + 1}`}
                  fill
                  priority={index === 0}
                  sizes="90vw"
                  className="object-cover pointer-events-none select-none"
                  draggable={false}
                />
              )
            )}
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-center justify-between">
        <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-ink">
          {images[active]?.kind === "video"
            ? "Video"
            : zoomed === null
            ? "Ketuk 2x untuk zoom"
            : "Geser untuk melihat · ketuk 2x untuk kembali"}
        </span>
        {!single && (
          <span className="rounded-full bg-ink/80 px-2.5 py-1 text-xs font-semibold text-white tabular-nums">
            {active + 1}/{images.length}
          </span>
        )}
      </div>
    </div>
  )
}

/**
 * Product images: a two-column grid with hover zoom and a full-screen viewer
 * on desktop, a swipeable strip with double-tap zoom on phones.
 */
const ImageGallery = ({ images, videos = [], title = "Produk" }: ImageGalleryProps) => {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)
  const media = toMedia(images, videos)

  if (media.length === 0) {
    return (
      <div className="relative aspect-square small:aspect-[4/3] w-full overflow-hidden bg-paper-100 flex flex-col items-center justify-center gap-y-3 text-ink-500/40">
        <ProductPlaceholder size={96} />
        <Text className="text-ink-500/50 text-small-regular">
          Foto produk segera hadir
        </Text>
      </div>
    )
  }

  return (
    <>
      <DesktopGrid images={media} title={title} onOpen={setViewerIndex} />
      <MobileStrip images={media} title={title} />
      <Viewer
        images={media}
        title={title}
        index={viewerIndex}
        onChange={setViewerIndex}
        onClose={() => setViewerIndex(null)}
      />
    </>
  )
}

export default ImageGallery
