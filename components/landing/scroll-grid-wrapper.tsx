"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const DynamicScrollTiltedGrid = dynamic(
  () => import("@/components/ui/scroll-tilted-grid").then((mod) => mod.ScrollTiltedGrid || mod.default),
  { ssr: false }
);

export const GALLERY_ITEMS = [
  {
    src: "/img/gallery/ideathon.svg",
    alt: "Campus Ideathon - Real high-resolution photo from campus Ideathon pitch requested",
    title: "Campus Ideathon",
    filename: "public/img/gallery/ideathon.svg",
    requested: "Real photo from campus Ideathon pitch & brainstorming session",
  },
  {
    src: "/img/gallery/workshop.svg",
    alt: "Workshops & Labs - Hands-on market research & founder masterclass photo requested",
    title: "Workshops & Labs",
    filename: "public/img/gallery/workshop.svg",
    requested: "Hands-on market research & founder masterclass session photo",
  },
  {
    src: "/img/gallery/hackathon.svg",
    alt: "Campus Hackathon - Student teams building prototypes during weekend hackathon photo requested",
    title: "Campus Hackathon",
    filename: "public/img/gallery/hackathon.svg",
    requested: "Student teams building working prototypes during weekend hackathon",
  },
  {
    src: "/img/gallery/esummit-expo.svg",
    alt: "E-Summit & Expo - Keynote, panel discussion & startup exhibition photo requested",
    title: "E-Summit & Expo",
    filename: "public/img/gallery/esummit-expo.svg",
    requested: "Keynote, panel discussion & campus startup exhibition photo",
  },
] as const;

interface ScrollGridWrapperProps {
  className?: string;
}

export function ScrollGridWrapper({ className }: ScrollGridWrapperProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const gridImages = GALLERY_ITEMS.map((item) => ({
    src: item.src,
    alt: item.alt,
  }));

  if (!mounted) {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto px-4 ${className || ""}`}>
        {gridImages.map((img) => (
          <div key={img.src} className="aspect-[4/3] rounded-lg overflow-hidden border border-border bg-card">
            <img src={img.src} alt={img.alt} className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={className}>
      <DynamicScrollTiltedGrid
        images={gridImages}
        smoothScroll={false}
        loop={false}
        aspectRatio="4 / 3"
        sectionPadding="4vh"
        maxTilt={24}
        maxBlur={2}
      />
    </div>
  );
}

export default ScrollGridWrapper;
