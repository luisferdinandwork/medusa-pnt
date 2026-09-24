import React from "react"

import { IconProps } from "types/icon"

/**
 * On-brand stand-in for products without photography yet - a simplified
 * sneaker silhouette (ink upper, red sole) instead of a generic image icon.
 */
const ProductPlaceholder: React.FC<IconProps> = ({
  size = "32",
  color = "currentColor",
  ...attributes
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...attributes}
    >
      <path
        d="M14 50C10 38 14 24 30 18C40 14 50 13 58 14L66 15C78 17 88 22 98 30C104 35 108 42 110 50L14 50Z"
        stroke={color}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M10 58C8 66 14 70 26 70L96 70C106 70 112 64 112 56L110 50L14 50C11 50 10 54 10 58Z"
        fill="#E8412B"
      />
      <path
        d="M58 18L68 30M64 16L76 28M70 15L82 27"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default ProductPlaceholder
