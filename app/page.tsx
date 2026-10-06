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
    <div className="flex min-h-screen flex-col bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
      <ScrollProgress />
      <LandingHeader />

      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        <LandingHero />
        <ProofStrip />
        <AboutSection />
        <ProgramsSection />
        <GallerySection />
        <TeamSection />
      </main>

      <LandingFooter />
    </div>
  );
}
