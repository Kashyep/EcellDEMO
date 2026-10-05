"use client";

import React, { useState, useEffect } from "react";
import { AuroraFlowWrapper } from "@/components/landing/aurora-flow-wrapper";
import { DitheredLogoWrapper } from "@/components/landing/dithered-logo-wrapper";
import { TextMorphWrapper } from "@/components/landing/text-morph-wrapper";

export function LandingHero() {
  const [introSettled, setIntroSettled] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motionQuery.matches) {
      setPrefersReducedMotion(true);
      setIntroSettled(true);
      return;
    }
    const motionListener = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setPrefersReducedMotion(true);
        setIntroSettled(true);
      }
    };
    motionQuery.addEventListener("change", motionListener);

    return () => {
      motionQuery.removeEventListener("change", motionListener);
    };
  }, []);

  return (
    <section className="relative w-full overflow-hidden min-h-[640px] sm:min-h-[720px] lg:min-h-[780px] flex items-center justify-center" aria-labelledby="hero-title">
      {/* AuroraFlow background ONLY behind Hero */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <AuroraFlowWrapper className="h-full min-h-[640px] sm:min-h-[720px] lg:min-h-[780px]" />
      </div>

      {/* Hero Foreground Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 flex flex-col items-center justify-center text-center">
        {!introSettled && !prefersReducedMotion ? (
          /* Centered Intro Words: Innovate -> Connect -> Elevate */
          <div className="flex flex-col items-center justify-center min-h-[380px] sm:min-h-[440px] space-y-6">
            <h1 id="hero-title" className="sr-only">
              Ideas don&apos;t wait for graduation. E-Cell SMVIT
            </h1>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card/60 backdrop-blur-sm text-xs font-mono text-muted-foreground uppercase tracking-widest">
              <span>Entrepreneurship Cell</span>
              <span className="text-border" aria-hidden="true">·</span>
              <span>SMVIT</span>
            </div>
            <div className="text-4xl sm:text-6xl lg:text-7xl font-black font-heading tracking-tight text-primary">
              <TextMorphWrapper
                onComplete={() => setIntroSettled(true)}
                className="text-4xl sm:text-6xl lg:text-7xl font-black font-heading uppercase tracking-wide text-primary"
              />
            </div>
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
              SMVIT, Bengaluru
            </p>
          </div>
        ) : (
          /* Settled Hero: Centered Vertically & Centrally with Centerpiece Logo */
          <div className="flex flex-col items-center justify-center text-center space-y-6 w-full">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card/60 backdrop-blur-sm text-xs font-mono text-muted-foreground uppercase tracking-widest">
              <span>Entrepreneurship Cell</span>
              <span className="text-border" aria-hidden="true">·</span>
              <span>SMVIT, Bengaluru</span>
            </div>

            {/* Centered Logo Centerpiece */}
            <div className="flex items-center justify-center w-full max-w-xs sm:max-w-sm mx-auto select-none pointer-events-none py-1">
              <DitheredLogoWrapper />
            </div>

            <h1
              id="hero-title"
              className="font-heading font-black text-4xl sm:text-6xl lg:text-7xl tracking-tight leading-[1.08] text-foreground max-w-3xl"
            >
              Ideas don&apos;t wait for{" "}
              <span className="text-primary">
                graduation.
              </span>
            </h1>

            {/* Settled Mission / Mantra */}
            <div className="flex items-center justify-center gap-2 text-base sm:text-lg font-bold text-primary uppercase tracking-wider">
              <span>Innovate</span>
              <span className="text-border" aria-hidden="true">·</span>
              <span>Connect</span>
              <span className="text-border" aria-hidden="true">·</span>
              <span>Elevate</span>
            </div>

            <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              We help SMVIT students take a hunch to a pitch, with mentors, competitions and a team that ships.
            </p>

            {/* Single Clear Minimal CTA + secondary */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2 w-full sm:w-auto">
              <a
                href="/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium text-sm sm:text-base hover:bg-primary/90 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span>Join E-Cell</span>
                <span aria-hidden="true">→</span>
              </a>
              <a
                href="#programs"
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-lg border border-border bg-card/60 hover:bg-accent text-foreground font-medium text-sm sm:text-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                See what we run
              </a>
            </div>

            {/* Meta details */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-xs font-mono text-muted-foreground">
              <span>Est. 2021</span>
              <span className="text-border" aria-hidden="true">·</span>
              <span>NEC · IIT Bombay &amp; IIT Madras</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default LandingHero;
