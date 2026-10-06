"use client";

import React, { useState, useEffect, useCallback } from "react";
import { LogIn, UserPlus } from "lucide-react";
import { AuroraFlowWrapper } from "@/components/landing/aurora-flow-wrapper";
import { DitheredLogoWrapper } from "@/components/landing/dithered-logo-wrapper";
import { TextMorphWrapper } from "@/components/landing/text-morph-wrapper";
import { CinematicPanel, type CinematicPanelLink } from "@/components/ui/cinematic-panel";
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe";

const PRIMARY_LINKS: CinematicPanelLink[] = [
  { label: "Join E-Cell", href: "/signup", icon: UserPlus },
  { label: "Log in", href: "/login", icon: LogIn },
];

const MARQUEE = [
  "Ideathons",
  "Workshops",
  "Hackathons",
  "E-Summit",
  "Student founders",
  "Sir MVIT Bengaluru",
];

export function LandingHero() {
  const [introSettled, setIntroSettled] = useState(false);
  const prefersReducedMotion = useReducedMotionSafe();

  const handleSettle = useCallback(() => {
    setIntroSettled(true);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      setIntroSettled(true);
    }
  }, [prefersReducedMotion]);

  useEffect(() => {
    // If arriving via skip link or hash navigation (#main or #hero),
    // settle immediately so keyboard users land directly on Join E-Cell / Log in
    const checkHash = () => {
      if (
        typeof window !== "undefined" &&
        (window.location.hash === "#main" || window.location.hash === "#hero")
      ) {
        setIntroSettled(true);
      }
    };

    checkHash();
    window.addEventListener("hashchange", checkHash);

    const mainEl = document.getElementById("main");
    const onMainFocus = () => setIntroSettled(true);
    mainEl?.addEventListener("focus", onMainFocus);

    return () => {
      window.removeEventListener("hashchange", checkHash);
      mainEl?.removeEventListener("focus", onMainFocus);
    };
  }, []);

  const isPanelSettled = introSettled || prefersReducedMotion;

  return (
    <CinematicPanel
      id="hero"
      headingId="hero-title"
      isSettled={isPanelSettled}
      onFocusCapture={handleSettle}
      background={
        <>
          {/* AuroraFlow background ONLY behind Hero / First screen */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <AuroraFlowWrapper className="h-full min-h-svh" />
          </div>

          {/* Exactly ONE decorative DitheredLogoWrapper in background behind h1 */}
          <DitheredLogoWrapper
            decorative
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[75vmin] h-[75vmin] max-w-[85vmin] max-h-[85vmin] opacity-20 pointer-events-none select-none z-0"
          />
        </>
      }
      marqueeItems={MARQUEE}
      pill={
        <>
          <span>Entrepreneurship Cell</span>
          <span className="text-border" aria-hidden="true">
            ·
          </span>
          <span>SMVIT, Bengaluru</span>
        </>
      }
      tagline="Ideas don't wait for graduation."
      heading="Build something before you graduate."
      mantra={
        <>
          <span>Innovate</span>
          <span className="text-border" aria-hidden="true">
            ·
          </span>
          <span>Connect</span>
          <span className="text-border" aria-hidden="true">
            ·
          </span>
          <span>Elevate</span>
        </>
      }
      description="Join SMVIT's community of student founders and makers."
      primaryLinks={PRIMARY_LINKS}
      secondaryCta={{ label: "See what we run", href: "#programs" }}
      meta={
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-muted-foreground">
          <span>Est. 2021</span>
          <span className="text-border" aria-hidden="true">
            ·
          </span>
          <span>NEC · IIT Bombay &amp; IIT Madras</span>
        </div>
      }
      intro={
        /* Centered Intro Words: Innovate -> Connect -> Elevate */
        <div className="flex flex-col items-center justify-center min-h-[380px] sm:min-h-[440px] space-y-6">
          <h1 id="hero-title" className="sr-only">
            Build something before you graduate. Ideas don&apos;t wait for graduation. E-Cell SMVIT
          </h1>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card/60 backdrop-blur-sm text-xs font-mono text-muted-foreground uppercase tracking-widest">
            <span>Entrepreneurship Cell</span>
            <span className="text-border" aria-hidden="true">
              ·
            </span>
            <span>SMVIT</span>
          </div>
          <div className="text-4xl sm:text-6xl lg:text-7xl font-black font-heading tracking-tight text-primary">
            <TextMorphWrapper
              onComplete={handleSettle}
              className="text-4xl sm:text-6xl lg:text-7xl font-black font-heading uppercase tracking-wide text-primary"
            />
          </div>
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
            SMVIT, Bengaluru
          </p>
        </div>
      }
    />
  );
}

export default LandingHero;
