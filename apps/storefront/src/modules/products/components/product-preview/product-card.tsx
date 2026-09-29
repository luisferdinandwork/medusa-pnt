"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Badge, Text, clx } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ProductPlaceholder from "@modules/common/icons/product-placeholder"
import { VariantPrice } from "types/global"

export type ColorOption = {
  handle: string
  label: string
  hex: string
  image?: string | null
}

const CYCLE_MS = 900

type ProductCardProps = {
  handle: string
  title: string
  image?: string | null
  colors: ColorOption[]
  price?: VariantPrice | null
  isNew?: boolean
  lowStock?: number
}

export default function ProductCard({
  handle,
  title,
  image,
  colors,
  price,
  isNew,
  lowStock,
}: ProductCardProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const hasColors = colors.length > 1

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const startCycle = () => {
    if (!hasColors) return
    clearTimer()
    timerRef.current = setInterval(() => {
      setActiveIndex((i) => (i + 1) % colors.length)
    }, CYCLE_MS)
  }

  const resetCycle = () => {
    clearTimer()
    setActiveIndex(0)
  }

  useEffect(() => clearTimer, [])

  const activeImage = hasColors ? colors[activeIndex]?.image ?? image : image

  return (
    <div className="relative" data-testid="product-wrapper">
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-y-1.5 items-start pointer-events-none">
        {price?.price_type === "sale" && Number(price.percentage_diff) > 0 && (
          <span className="inline-flex items-center rounded-full bg-red-500 px-2 py-1 text-xs font-semibold text-white">
            -{price.percentage_diff}%
          </span>
        )}
        {isNew && <Badge color="ink">Baru</Badge>}
        {!!lowStock && (
          <Badge color="red" outline>
            Sisa {lowStock}
          </Badge>
        )}
      </div>

      <LocalizedClientLink
        href={`/products/${handle}`}
        className="group block"
        onMouseEnter={startCycle}
        onMouseLeave={resetCycle}
      >
        <div className="relative w-full aspect-[4/5] overflow-hidden p-4 bg-photo shadow-elevation-card-rest rounded-large group-hover:shadow-elevation-card-hover transition-shadow ease-in-out duration-150">
          {activeImage ? (
            hasColors ? (
              colors.map((c, i) => (
                <Image
                  key={`${c.handle}-${i}`}
                  src={c.image || image || ""}
                  alt={`${title} - ${c.label}`}
                  fill
                  draggable={false}
                  quality={70}
                  sizes="(max-width: 576px) 280px, (max-width: 768px) 360px, (max-width: 992px) 480px, 800px"
                  className={clx(
                    "absolute inset-0 object-contain object-center mix-blend-darken transition-opacity duration-500 ease-in-out",
                    i === activeIndex ? "opacity-100" : "opacity-0"
                  )}
                />
              ))
            ) : (
              <Image
                src={activeImage}
                alt={title}
                fill
                draggable={false}
                quality={70}
                sizes="(max-width: 576px) 280px, (max-width: 768px) 360px, (max-width: 992px) 480px, 800px"
                className="absolute inset-0 object-contain object-center mix-blend-darken transition-transform duration-500 ease-in-out group-hover:scale-105"
              />
            )
          ) : (
            <div className="w-full h-full absolute inset-0 flex items-center justify-center bg-paper-100 text-ink-500/40">
              <ProductPlaceholder size={40} />
            </div>
          )}
        </div>
        <div className="flex flex-col txt-compact-medium mt-4 gap-y-1">
          <Text className="text-ink font-medium" data-testid="product-title">
            {title}
          </Text>
          {price && (
            <div className="flex items-center gap-x-2">
              <Text
                className={clx("font-semibold", {
                  "text-red-500": price.price_type === "sale",
                  "text-ink": price.price_type !== "sale",
                })}
                data-testid="price"
              >
                {price.calculated_price}
              </Text>
              {price.price_type === "sale" && (
                <Text className="line-through text-ink-500/50 text-xsmall-regular">
                  {price.original_price}
                </Text>
              )}
            </div>
          )}
        </div>
      </LocalizedClientLink>

      {hasColors && (
        <div className="flex items-center gap-1.5 mt-2">
          {colors.map((c, i) => (
            <LocalizedClientLink
              key={c.handle}
              href={`/products/${c.handle}`}
              aria-label={c.label}
              onMouseEnter={() => {
                clearTimer()
                setActiveIndex(i)
              }}
              onMouseLeave={startCycle}
              className={clx(
                "h-4 w-4 rounded-full border transition-transform block",
                i === activeIndex
                  ? "border-ink scale-110"
                  : "border-paper-200 hover:scale-110"
              )}
              style={{ background: c.hex }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
