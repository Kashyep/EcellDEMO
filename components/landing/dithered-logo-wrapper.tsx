"use client";

import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

const DynamicDitheredLogo = dynamic(
  () => import("@/components/ui/dithered-logo").then((mod) => mod.DitheredLogo || mod.default),
  { ssr: false }
);

interface DitheredLogoWrapperProps {
  className?: string;
}

export function DitheredLogoWrapper({ className }: DitheredLogoWrapperProps) {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [hasCanvasSupport, setHasCanvasSupport] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);

  const handleReady = useCallback(() => {
    setCanvasReady(true);
  }, []);

  const handleError = useCallback(() => {
    setHasCanvasSupport(false);
  }, []);

  useEffect(() => {
    setMounted(true);

    // Check prefers-reduced-motion
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(motionQuery.matches);
    const motionListener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    motionQuery.addEventListener("change", motionListener);

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
      motionQuery.removeEventListener("change", motionListener);
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
      aria-hidden={canvasReady}
    >
      <img
        src={imageSrc}
        alt="E-Cell SMVIT logo"
        width={180}
        height={180}
        className="w-36 h-36 sm:w-44 sm:h-44 object-contain opacity-95 select-none pointer-events-none"
        loading="eager"
      />
    </div>
  );

  if (!mounted || prefersReducedMotion || !hasCanvasSupport) {
    return (
      <div
        className={cn(
          "relative flex items-center justify-center w-48 h-48 sm:w-56 sm:h-56 pointer-events-none select-none",
          className
        )}
        aria-label="E-Cell SMVIT logo"
      >
        <div className="relative flex items-center justify-center w-48 h-48 sm:w-56 sm:h-56">
          <img
            src={imageSrc}
            alt="E-Cell SMVIT logo"
            width={180}
            height={180}
            className="w-36 h-36 sm:w-44 sm:h-44 object-contain opacity-95 select-none pointer-events-none"
            loading="eager"
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex items-center justify-center w-48 h-48 sm:w-56 sm:h-56 pointer-events-none select-none",
        className
      )}
      aria-label="E-Cell SMVIT interactive logo"
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
          gridSize={56}
          onReady={handleReady}
          onError={handleError}
          className="pointer-events-none w-48 h-48 sm:w-56 sm:h-56"
        />
      </div>
    </div>
  );
}

export default DitheredLogoWrapper;
