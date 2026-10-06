"use client";

import React from "react";
import { motion, useScroll, type MotionProps } from "motion/react";
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe";
import { cn } from "@/lib/utils";

type ScrollProgressProps = Omit<React.HTMLAttributes<HTMLElement>, keyof MotionProps>;

export function ScrollProgress({ className, ...props }: ScrollProgressProps) {
  const shouldReduceMotion = useReducedMotionSafe();
  const { scrollYProgress } = useScroll();

  if (shouldReduceMotion) {
    return null;
  }

  return (
    <motion.div
      className={cn(
        "fixed inset-x-0 top-0 z-[100] h-0.5 origin-left bg-[var(--accent)] motion-reduce:hidden",
        className,
      )}
      style={{ scaleX: scrollYProgress }}
      aria-hidden="true"
      {...props}
    />
  );
}

export default ScrollProgress;
