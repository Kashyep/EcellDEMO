"use client";

import React, { useRef, useEffect, useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface TextHoverEffectProps {
  text: string;
  duration?: number;
  className?: string;
  automatic?: boolean;
}

export const TextHoverEffect = ({
  text,
  duration,
  className,
}: TextHoverEffectProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [cursor, setCursor] = useState<{ x: number | null; y: number | null }>({
    x: null,
    y: null,
  });
  const [hovered, setHovered] = useState(false);
  const [maskPosition, setMaskPosition] = useState({ cx: "50%", cy: "50%" });
  const [isInteractive, setIsInteractive] = useState(false);

  useEffect(() => {
    const isTouch = window.matchMedia("(hover: none)").matches;
    const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!isTouch && !isReduced) {
      setIsInteractive(true);
    }
  }, []);

  useEffect(() => {
    if (svgRef.current && cursor.x !== null && cursor.y !== null) {
      const svgRect = svgRef.current.getBoundingClientRect();
      const cxPercentage = ((cursor.x - svgRect.left) / svgRect.width) * 100;
      const cyPercentage = ((cursor.y - svgRect.top) / svgRect.height) * 100;
      setMaskPosition({
        cx: `${cxPercentage}%`,
        cy: `${cyPercentage}%`,
      });
    }
  }, [cursor]);

  // Static outlined text for SSR, touch/no-hover, and reduced-motion devices
  if (!isInteractive) {
    return (
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 300 100"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("select-none", className)}
        aria-hidden="true"
      >
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          strokeWidth="0.5"
          className="fill-transparent stroke-foreground/20 font-heading text-7xl font-black uppercase tracking-wider"
        >
          {text}
        </text>
      </svg>
    );
  }

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="100%"
      viewBox="0 0 300 100"
      xmlns="http://www.w3.org/2000/svg"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setCursor({ x: null, y: null });
      }}
      onMouseMove={(e) => setCursor({ x: e.clientX, y: e.clientY })}
      className={cn("select-none", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="textGradient"
          gradientUnits="userSpaceOnUse"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%"
        >
          {hovered && (
            <>
              <stop offset="0%" stopColor="var(--accent)" />
              <stop offset="50%" stopColor="var(--mark)" />
              <stop offset="100%" stopColor="var(--accent)" />
            </>
          )}
        </linearGradient>

        <motion.radialGradient
          id="revealMask"
          gradientUnits="userSpaceOnUse"
          r="25%"
          initial={{ cx: "50%", cy: "50%" }}
          animate={maskPosition}
          transition={{ duration: duration ?? 0, ease: "easeOut" }}
        >
          <stop offset="0%" stopColor="white" />
          <stop offset="100%" stopColor="black" />
        </motion.radialGradient>
        <mask id="textMask">
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="url(#revealMask)"
          />
        </mask>
      </defs>
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        strokeWidth="0.5"
        className="fill-transparent stroke-foreground/15 font-heading text-7xl font-black uppercase tracking-wider"
        style={{ opacity: hovered ? 0.7 : 0 }}
      >
        {text}
      </text>
      <motion.text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        strokeWidth="0.5"
        className="fill-transparent stroke-foreground/20 font-heading text-7xl font-black uppercase tracking-wider"
        initial={{ strokeDashoffset: 1000, strokeDasharray: 1000 }}
        animate={{
          strokeDashoffset: 0,
          strokeDasharray: 1000,
        }}
        transition={{
          duration: 3,
          ease: "easeInOut",
        }}
      >
        {text}
      </motion.text>
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        stroke="url(#textGradient)"
        strokeWidth="0.5"
        mask="url(#textMask)"
        className="fill-transparent font-heading text-7xl font-black uppercase tracking-wider"
      >
        {text}
      </text>
    </svg>
  );
};

export default TextHoverEffect;
