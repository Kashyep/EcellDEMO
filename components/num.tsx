"use client";

import React from "react";
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe";
import { cn } from "@/lib/utils";
import { NumberTicker } from "@/components/ui/number-ticker";
import { SlidingNumber } from "@/components/ui/sliding-number";

export interface NumProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  value: number;
  className?: string;
  /** "count": counts up when scrolled into view. "slide": digits roll when the value changes. */
  animate?: "count" | "slide";
  /** Thousands separators for animate="count". Turn off for years. */
  grouping?: boolean;
}

/** The only place the pixel font is applied: numbers only. */
export function Num({ value, className, style, animate, grouping = true, ...props }: NumProps) {
  const reduceMotion = useReducedMotionSafe();
  const isValid = typeof value === "number" && !isNaN(value);

  if (!isValid && process.env.NODE_ENV !== "production") {
    console.warn(`Num component expected numeric value only but received: "${value}"`);
  }

  const safe = isValid ? value : 0;
  const str = String(safe);
  const animated = animate && !reduceMotion;

  return (
    <span
      className={cn("font-pixel tabular-nums inline-block text-[max(12px,1em)]", className)}
      style={{
        fontSize: "max(12px, 1em)",
        ...style,
      }}
      {...props}
    >
      {animated ? (
        <>
          <span className="sr-only">{str}</span>
          <span aria-hidden="true">
            {animate === "count" ? (
              <NumberTicker value={safe} useGrouping={grouping} />
            ) : (
              <SlidingNumber value={safe} />
            )}
          </span>
        </>
      ) : (
        str
      )}
    </span>
  );
}

export default Num;
