"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe";
import {
  type GalleryItem,
  getFilterCategories,
  getGalleryItems,
  getKolkataDateString,
} from "@/lib/gallery";
import { GalleryCard } from "@/components/landing/gallery-card";
import { GalleryDialog } from "@/components/landing/gallery-dialog";
import { buttonVariants } from "@/components/ui/button";
import { Camera, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScrollTiltedGridProps } from "@/components/ui/scroll-tilted-grid";

const DynamicScrollTiltedGrid = dynamic<ScrollTiltedGridProps<GalleryItem>>(
  () => import("@/components/ui/scroll-tilted-grid").then((mod) => mod.ScrollTiltedGrid || mod.default),
  { ssr: false }
);

export interface ScrollGridWrapperProps {
  initialItems?: GalleryItem[];
  referenceDate?: string | Date;
  className?: string;
}

export function ScrollGridWrapper({ initialItems, referenceDate, className }: ScrollGridWrapperProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  // Evaluate live Asia/Kolkata date dynamically at client runtime to prevent freezing during static build
  const [todayKolkata, setTodayKolkata] = useState<string>(() =>
    referenceDate ? getKolkataDateString(referenceDate) : ""
  );
  const triggerRef = useRef<HTMLElement | null>(null);
  const reduceMotion = useReducedMotionSafe();

  // Load items from props or fallback to pure client validation
  const allItems = useMemo(() => {
    return initialItems && initialItems.length > 0 ? initialItems : getGalleryItems();
  }, [initialItems]);

  // Derived filter categories with "All" first and mapped category labels
  const filterCategories = useMemo(() => {
    return getFilterCategories(allItems);
  }, [allItems]);

  // Filtered items based on active chip
  const filteredItems = useMemo(() => {
    if (activeFilter === "all") {
      return allItems;
    }
    return allItems.filter(
      (item) => item.category.trim().toLowerCase() === activeFilter.trim().toLowerCase()
    );
  }, [allItems, activeFilter]);

  // Hydration-safe date evaluation in Asia/Kolkata
  useEffect(() => {
    setMounted(true);
    if (!referenceDate) {
      setTodayKolkata(getKolkataDateString(new Date()));
    }
  }, [referenceDate]);

  const handleSelect = (item: GalleryItem) => {
    if (typeof document !== "undefined") {
      triggerRef.current = document.activeElement as HTMLElement;
    }
    setSelectedItem(item);
  };

  const handleClose = () => {
    setSelectedItem(null);
    // Restore focus to triggering card button
    if (triggerRef.current) {
      setTimeout(() => {
        triggerRef.current?.focus();
      }, 0);
    }
  };

  return (
    <div className={cn("space-y-8", className)}>
      {/* Category Filter Chips */}
      <div
        role="toolbar"
        aria-label="Filter gallery by category"
        className="flex flex-wrap items-center justify-start gap-2 pt-2"
      >
        {filterCategories.map((category) => {
          const isActive = activeFilter.toLowerCase() === category.key.toLowerCase();
          return (
            <button
              key={category.key}
              type="button"
              onClick={() => setActiveFilter(category.key)}
              aria-pressed={isActive}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs sm:text-sm font-medium transition-all outline-none",
                "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/40"
              )}
            >
              {category.label}
            </button>
          );
        })}
      </div>

      {/* Grid: Reduced motion or Calm Tilted Grid */}
      {!mounted || reduceMotion ? (
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="aspect-[4/5] w-full overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm"
            >
              <GalleryCard
                item={item}
                todayKolkata={todayKolkata}
                onSelect={handleSelect}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="relative">
          <DynamicScrollTiltedGrid
            items={filteredItems}
            renderCard={(item: GalleryItem) => (
              <GalleryCard
                item={item}
                todayKolkata={todayKolkata}
                onSelect={handleSelect}
              />
            )}
            smoothScroll={false}
            loop={false}
            aspectRatio="4 / 5"
            sectionPadding="2vh"
            perspective={1200}
            maxTilt={8}
            maxBlur={0}
          />
        </div>
      )}

      {/* Follow @ecell_smvit on Instagram Below Grid */}
      <div className="flex flex-col items-center justify-center pt-8 sm:pt-12 text-center">
        <a
          href="https://www.instagram.com/ecell_smvit/"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "group inline-flex items-center gap-2.5 rounded-full border-border/80 px-6 py-2.5 text-sm font-medium transition-colors hover:border-primary hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 motion-reduce:transition-none"
          )}
        >
          <Camera className="size-4 transition-transform motion-reduce:transform-none motion-reduce:transition-none group-hover:scale-110 motion-reduce:group-hover:scale-100" />
          <span>Follow @ecell_smvit on Instagram</span>
          <ExternalLink className="size-3.5 opacity-60 transition-transform motion-reduce:transform-none motion-reduce:transition-none group-hover:translate-x-0.5 motion-reduce:group-hover:translate-x-0" />
        </a>
      </div>

      {/* Accessible Detail Dialog with focus restoration */}
      <GalleryDialog
        item={selectedItem}
        todayKolkata={todayKolkata}
        onClose={handleClose}
      />
    </div>
  );
}

export default ScrollGridWrapper;
