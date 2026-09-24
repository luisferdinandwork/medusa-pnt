import React from "react"

import { IconProps } from "types/icon"

const Grid: React.FC<IconProps> = ({
  size = "20",
  color = "currentColor",
  ...attributes
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...attributes}
    >
      <rect x="2.5" y="2.5" width="6.25" height="6.25" rx="1.25" stroke={color} strokeWidth="1.5" />
      <rect x="11.25" y="2.5" width="6.25" height="6.25" rx="1.25" stroke={color} strokeWidth="1.5" />
      <rect x="2.5" y="11.25" width="6.25" height="6.25" rx="1.25" stroke={color} strokeWidth="1.5" />
      <rect x="11.25" y="11.25" width="6.25" height="6.25" rx="1.25" stroke={color} strokeWidth="1.5" />
    </svg>
  )
}

export default Grid
