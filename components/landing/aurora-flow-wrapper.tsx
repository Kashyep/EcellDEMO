"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { WebGLErrorBoundary } from "@/components/ui/webgl-error-boundary";

const DynamicAuroraFlow = dynamic(
  () => import("@/components/ui/aurora-flow").then((mod) => mod.AuroraFlow || mod.default),
  { ssr: false }
);

interface AuroraFlowWrapperProps {
  children?: React.ReactNode;
  className?: string;
}

const LIGHT_COLORS = ["#eef0f5", "#f9fafc", "#2b4cff", "#7d8fff", "#d3d8e3"];
const DARK_COLORS = ["#0c1120", "#131a2c", "#2b4cff", "#7d8fff", "#060912"];

export function AuroraFlowWrapper({ children, className }: AuroraFlowWrapperProps) {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    setMounted(true);
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(motionQuery.matches);
    const motionListener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    motionQuery.addEventListener("change", motionListener);

    // Capability check for WebGL
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) {
        setHasWebGL(false);
      }
    } catch {
      setHasWebGL(false);
    }

    // Resolve theme from html data-theme / class
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

  // Plain solid background fallback (used for SSR, reduced motion, or WebGL context failures)
  const plainFallback = (
    <div
      className={`relative w-full overflow-hidden bg-background ${className || ""}`}
      style={{
        backgroundColor: "hsl(var(--background))",
      }}
    >
      {children}
    </div>
  );

  if (!mounted || prefersReducedMotion || !hasWebGL) {
    return plainFallback;
  }

  return (
    <WebGLErrorBoundary fallback={plainFallback}>
      <DynamicAuroraFlow
        className={`relative w-full overflow-hidden ${className || ""}`}
        pointerInteraction={false}
        scrollInteraction={false}
        intensity={0.4}
        opacity={0.3}
        speed={0.4}
        animationSpeed={0.5}
        colors={isDark ? DARK_COLORS : LIGHT_COLORS}
      >
        {children}
      </DynamicAuroraFlow>
    </WebGLErrorBoundary>
  );
}

export default AuroraFlowWrapper;
