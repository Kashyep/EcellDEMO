"use client";

import React from "react";
import { ScrollGridWrapper, GALLERY_ITEMS } from "@/components/landing/scroll-grid-wrapper";

export function GallerySection() {
  return (
    <section id="gallery" className="py-20 sm:py-28" aria-labelledby="gallery-title">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
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

        {/* Explicitly listing exact filenames and requested images in the gallery UI */}
        <div className="rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Notice: Local SVG Placeholders Active — High-Resolution Photos Requested</span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            The repository contains local SVG placeholders pending event photo submissions from the campus organizers.
            To replace a placeholder, provide high-resolution images matching the filenames below:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {GALLERY_ITEMS.map((item) => (
              <div
                key={item.filename}
                className="flex flex-col p-3 rounded-lg border border-border/80 bg-card/80 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">{item.title}</span>
                  <span className="font-mono text-[10px] text-amber-500 font-medium">Placeholder</span>
                </div>
                <code className="text-[11px] font-mono text-muted-foreground break-all">
                  {item.filename}
                </code>
                <p className="text-[11px] text-muted-foreground/90 italic pt-0.5">
                  Requested: {item.requested}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ScrollTiltedGrid Component Display */}
        <div className="relative pt-4">
          <ScrollGridWrapper />
        </div>
      </div>
    </section>
  );
}

export default GallerySection;
