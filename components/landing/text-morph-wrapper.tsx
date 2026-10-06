"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const DynamicTextMorph = dynamic(
  () => import("@/components/ui/text-morph").then((mod) => mod.TextMorph || mod.default),
  { ssr: false }
);

interface TextMorphWrapperProps {
  className?: string;
  onComplete?: () => void;
}

const WORDS = ["Innovate", "Connect", "Elevate"];

export function TextMorphWrapper({ className, onComplete }: TextMorphWrapperProps) {
  const [mounted, setMounted] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    setMounted(true);
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(motionQuery.matches);
    const motionListener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    motionQuery.addEventListener("change", motionListener);

    return () => {
      motionQuery.removeEventListener("change", motionListener);
    };
  }, []);

  // Reduced motion: static all 3 words, no animation
  if (!mounted || prefersReducedMotion) {
    return (
      <span className={`inline-flex items-center font-bold tracking-tight ${className || ""}`}>
        Innovate · Connect · Elevate
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center font-bold tracking-tight ${className || ""}`}>
      <DynamicTextMorph
        words={WORDS}
        interval={850}
        morphDuration={420}
        loop={false}
        onComplete={onComplete}
        className={className}
      />
    </span>
  );
}

export default TextMorphWrapper;
