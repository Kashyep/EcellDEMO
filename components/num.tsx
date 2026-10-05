import React from "react";
import { cn } from "@/lib/utils";

export interface NumProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  value: number;
  className?: string;
}

export function Num({ value, className, style, ...props }: NumProps) {
  const isValid = typeof value === "number" && !isNaN(value);

  if (!isValid && process.env.NODE_ENV !== "production") {
    console.warn(`Num component expected numeric value only but received: "${value}"`);
  }

  const str = isValid ? String(value) : "0";

  return (
    <span
      className={cn("font-pixel tabular-nums inline-block text-[max(12px,1em)]", className)}
      style={{
        fontSize: "max(12px, 1em)",
        ...style,
      }}
      {...props}
    >
      {str}
    </span>
  );
}

export default Num;
