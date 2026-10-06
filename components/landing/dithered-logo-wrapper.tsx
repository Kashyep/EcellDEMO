"use client";

import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe";

const DynamicDitheredLogo = dynamic(
  () => import("@/components/ui/dithered-logo").then((mod) => mod.DitheredLogo || mod.default),
  { ssr: false }
);

export interface DitheredLogoWrapperProps {
  className?: string;
  decorative?: boolean;
}

export function DitheredLogoWrapper({ className, decorative = false }: DitheredLogoWrapperProps) {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [hasCanvasSupport, setHasCanvasSupport] = useState(true);
  const prefersReducedMotion = useReducedMotionSafe();
  const [canvasReady, setCanvasReady] = useState(false);

  const handleReady = useCallback(() => {
    setCanvasReady(true);
  }, []);

  const handleError = useCallback(() => {
    setHasCanvasSupport(false);
  }, []);

  useEffect(() => {
    setMounted(true);

    // Safe canvas 2D capability check
    try {
      const testCanvas = document.createElement("canvas");
      const ctx = testCanvas.getContext("2d");
      if (!ctx) {
        setHasCanvasSupport(false);
      }
    } catch {
      setHasCanvasSupport(false);
    }

    // Resolve theme (data-theme attribute, class, or matchMedia)
    const checkTheme = () => {
      const rootTheme = document.documentElement.getAttribute("data-theme");
      const hasDarkClass = document.documentElement.classList.contains("dark");
      if (rootTheme === "dark" || hasDarkClass) {
        setIsDark(true);
      } else if (rootTheme === "light") {
        setIsDark(false);
      } else {
        setIsDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
      }
    };

    checkTheme();
    const themeObserver = new MutationObserver(checkTheme);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "class"],
    });

    return () => {
      themeObserver.disconnect();
    };
  }, []);

  const imageSrc = isDark ? "/img/logo-white.png" : "/img/logo-black.svg";
  const invert = !isDark; // black logo requires invert=true, white logo invert=false
  const particleColor = isDark ? "#ffffff" : "#000000";

  // Plain img fallback visible while loading, on reduced motion, or if canvas fails
  const fallbackImg = (
    <div
      className={cn(
        "absolute inset-0 flex items-center justify-center transition-opacity duration-300",
        canvasReady ? "opacity-0 pointer-events-none" : "opacity-100"
      )}
      aria-hidden={decorative || canvasReady}
    >
      <img
        src={imageSrc}
        alt={decorative ? "" : "E-Cell SMVIT logo"}
        className="w-full h-full object-contain select-none pointer-events-none"
        loading="eager"
      />
    </div>
  );

  const containerClasses = cn(
    "relative flex items-center justify-center pointer-events-none select-none",
    className || "w-48 h-48 sm:w-56 sm:h-56"
  );

  if (!mounted || prefersReducedMotion || !hasCanvasSupport) {
    return (
      <div
        className={containerClasses}
        aria-hidden={decorative ? "true" : undefined}
        aria-label={decorative ? undefined : "E-Cell SMVIT logo"}
      >
        <img
          src={imageSrc}
          alt={decorative ? "" : "E-Cell SMVIT logo"}
          className="w-full h-full object-contain select-none pointer-events-none"
          loading="eager"
        />
      </div>
    );
  }

  return (
    <div
      className={containerClasses}
      aria-hidden={decorative ? "true" : undefined}
      aria-label={decorative ? undefined : "E-Cell SMVIT interactive logo"}
    >
      {fallbackImg}
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center transition-opacity duration-300",
          canvasReady ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <DynamicDitheredLogo
          imageSrc={imageSrc}
          invert={invert}
          particleColor={particleColor}
          scale={0.88}
          gridSize={64}
          onReady={handleReady}
          onError={handleError}
          className="pointer-events-none w-full h-full"
        />
      </div>
    </div>
  );
}

export default DitheredLogoWrapper;
