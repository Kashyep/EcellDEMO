"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe";

const DynamicScrollTiltedGrid = dynamic(
  () => import("@/components/ui/scroll-tilted-grid").then((mod) => mod.ScrollTiltedGrid || mod.default),
  { ssr: false }
);

/** Gallery entries. Placeholder art lives in public/img/gallery (see README "Gallery photos"). */
export const GALLERY_ITEMS = [
  {
    src: "/img/gallery/ideathon.svg",
    alt: "Campus Ideathon",
    title: "Campus Ideathon",
    description: "Pitching and brainstorming first ideas on campus.",
  },
  {
    src: "/img/gallery/workshop.svg",
    alt: "Workshops & Labs",
    title: "Workshops & Labs",
    description: "Hands-on market research and founder masterclasses.",
  },
  {
    src: "/img/gallery/hackathon.svg",
    alt: "Campus Hackathon",
    title: "Campus Hackathon",
    description: "Student teams building working prototypes over a weekend.",
  },
  {
    src: "/img/gallery/esummit-expo.svg",
    alt: "E-Summit & Expo",
    title: "E-Summit & Expo",
    description: "Keynotes, panels and a campus startup exhibition.",
  },
] as const;

function PlainGrid({ className }: { className?: string }) {
  return (
    <ul className={`grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto px-4 ${className || ""}`}>
      {GALLERY_ITEMS.map((item) => (
        <li key={item.src}>
          <figure className="relative m-0 aspect-[4/3] overflow-hidden rounded-lg border border-border bg-card">
            <img src={item.src} alt={item.alt} className="h-full w-full object-cover" />
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent px-5 pb-5 pt-12 text-white">
              <span className="block text-lg font-semibold leading-tight">{item.title}</span>
              <span className="mt-1 block text-base leading-snug text-white/85">{item.description}</span>
            </figcaption>
          </figure>
        </li>
      ))}
    </ul>
  );
}

export function ScrollGridWrapper({ className }: { className?: string }) {
  const [mounted, setMounted] = useState(false);
  const reduceMotion = useReducedMotionSafe();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || reduceMotion) {
    return <PlainGrid className={className} />;
  }

  return (
    <div className={className}>
      <DynamicScrollTiltedGrid
        images={GALLERY_ITEMS}
        smoothScroll={false}
        loop={false}
        aspectRatio="4 / 3"
        sectionPadding="4vh"
        perspective={1200}
        maxTilt={8}
        maxBlur={0}
      />
    </div>
  );
}

export default ScrollGridWrapper;
