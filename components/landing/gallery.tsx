"use client";

import React from "react";
import { BlurFade } from "@/components/ui/blur-fade";
import { ScrollGridWrapper } from "@/components/landing/scroll-grid-wrapper";

export function GallerySection() {
  return (
    <section id="gallery" className="py-20 sm:py-28" aria-labelledby="gallery-title">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header & Intro Text */}
        <BlurFade inView>
          <div className="max-w-3xl space-y-4">
            <div className="text-xs uppercase font-mono tracking-widest text-primary font-bold">
              Campus Moments
            </div>
            <h2
              id="gallery-title"
              className="text-3xl sm:text-5xl font-heading font-black tracking-tight text-foreground"
            >
              Events &amp; Community Gallery
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              From overnight hackathons to keynote speaker sessions at the national level, here is how our builders collaborate.
            </p>
          </div>
        </BlurFade>

        <div className="relative pt-4">
          <ScrollGridWrapper />
        </div>
      </div>
    </section>
  );
}

export default GallerySection;
