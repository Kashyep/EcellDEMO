import React from "react";
import { ScrollProgress } from "@/components/ui/scroll-progress";
import { LandingHeader } from "@/components/landing/header";
import { LandingHero } from "@/components/landing/hero";
import { ProofStrip } from "@/components/landing/proof-strip";
import { AboutSection } from "@/components/landing/about";
import { ProgramsSection } from "@/components/landing/programs";
import { GallerySection } from "@/components/landing/gallery";
import { TeamSection } from "@/components/landing/team";
import { LandingFooter } from "@/components/landing/footer";

export const metadata = {
  title: "E-Cell SMVIT | Entrepreneurship Cell",
  description:
    "E-Cell SMVIT, the entrepreneurship cell at Sir M. Visvesvaraya Institute of Technology, Bengaluru. Connecting student builders with mentors, competitions and launchpads.",
};

export default function HomePage() {
  return (
    <div className="relative isolate flex min-h-screen flex-col bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
      {/* Faint, static continuation of the hero aurora tint behind every section. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 opacity-20 [background:radial-gradient(55%_45%_at_12%_30%,hsl(var(--accent-hsl)/0.55),transparent_70%),radial-gradient(45%_40%_at_88%_78%,hsl(var(--accent-hsl)/0.35),transparent_70%)]"
      />
      <ScrollProgress />
      <LandingHeader />

      <main id="main" tabIndex={-1} className="relative z-[1] flex-1 focus:outline-none">
        <LandingHero />
        <ProofStrip />
        <AboutSection />
        <ProgramsSection />
        <GallerySection />
        <TeamSection />
      </main>

      <div className="relative z-[1]">
        <LandingFooter />
      </div>
    </div>
  );
}
