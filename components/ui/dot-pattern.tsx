import React, { useId } from "react"

import { cn } from "@/lib/utils"

/**
 * Magic UI DotPattern, adapted: one SVG <pattern> instead of one animated node per dot,
 * so full-height section backgrounds stay cheap. Static, so nothing to reduce for motion.
 * Colour comes from `currentColor` (set a text-* class); fade it with a CSS mask.
 */
interface DotPatternProps extends React.SVGProps<SVGSVGElement> {
  width?: number
  height?: number
  x?: number
  y?: number
  cx?: number
  cy?: number
  cr?: number
  className?: string
}

export function DotPattern({
  width = 16,
  height = 16,
  x = 0,
  y = 0,
  cx = 1,
  cy = 1,
  cr = 1,
  className,
  ...props
}: DotPatternProps) {
  const id = useId()

  return (
    <svg
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full text-muted-foreground/30",
        className
      )}
      {...props}
    >
      <defs>
        <pattern
          id={`${id}-dots`}
          width={width}
          height={height}
          x={x}
          y={y}
          patternUnits="userSpaceOnUse"
        >
          <circle cx={cx} cy={cy} r={cr} fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id}-dots)`} />
    </svg>
  )
}
