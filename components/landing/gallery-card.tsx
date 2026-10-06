"use client";

import React, { useState } from "react";
import Image from "next/image";
import { type GalleryItem, formatDisplayDate, isUpcoming } from "@/lib/gallery";
import { cn } from "@/lib/utils";

export interface GalleryCardProps {
  item: GalleryItem;
  todayKolkata: string;
  onSelect: (item: GalleryItem) => void;
  className?: string;
}

export function BrandedCardFallback({
  item,
}: {
  item: GalleryItem;
}) {
  return (
    <div className="relative flex h-full w-full flex-col justify-between overflow-hidden bg-primary bg-gradient-to-br from-primary via-blue-700 to-indigo-900 p-5 text-white select-none">
      {/* Subtle brand lighting glow */}
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-10 -left-10 h-44 w-44 rounded-full bg-indigo-950/40 blur-3xl"
        aria-hidden="true"
      />

      {/* Top Bar: Official decorative white logo + Category mark */}
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Image
            src="/img/logo-white.png"
            alt=""
            width={112}
            height={28}
            className="h-7 w-auto object-contain opacity-95 drop-shadow-sm"
          />
        </div>
        <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-mono font-medium uppercase tracking-wider text-white backdrop-blur-xs">
          {item.category}
        </span>
      </div>

      {/* Centerpiece: Clean event typography branding */}
      <div className="relative z-10 my-auto py-2">
        <span className="text-[11px] font-mono uppercase tracking-widest text-white/80 font-bold block mb-1">
          Campus Event
        </span>
        <h3 className="text-lg sm:text-xl font-bold font-heading text-white tracking-tight leading-snug line-clamp-3">
          {item.title}
        </h3>
      </div>

      {/* Spacer so bottom overlay content doesn't collide */}
      <div className="h-16" aria-hidden="true" />
    </div>
  );
}

export function GalleryCard({
  item,
  todayKolkata,
  onSelect,
  className,
}: GalleryCardProps) {
  const [imageError, setImageError] = useState(false);
  const showImage = item.hasLocalImage && !imageError;
  const upcoming = Boolean(todayKolkata && isUpcoming(item.date, todayKolkata));

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      aria-haspopup="dialog"
      aria-label={`Open details for ${item.title}`}
      className={cn(
        "group relative block h-full w-full overflow-hidden text-left cursor-pointer motion-reduce:transition-none",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
    >
      {/* 4 / 5 portrait media layer */}
      <div className="relative h-full w-full overflow-hidden bg-neutral-900">
        {showImage ? (
          <Image
            src={item.image}
            alt={item.alt || ""}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:transform-none motion-reduce:group-hover:scale-100"
            onError={() => setImageError(true)}
          />
        ) : (
          <BrandedCardFallback item={item} />
        )}

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between gap-2 pointer-events-none">
          <div className="flex items-center gap-1.5 flex-wrap">
            {item.featured ? (
              <span className="rounded-md bg-amber-500/90 px-2 py-0.5 text-[11px] font-semibold text-black shadow-sm backdrop-blur-xs">
                Featured
              </span>
            ) : null}
            {upcoming ? (
              <span className="rounded-md bg-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground shadow-sm">
                Upcoming
              </span>
            ) : null}
          </div>
        </div>

        {/* Dark Scrim guaranteeing >= 4.5:1 text contrast */}
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent"
          aria-hidden="true"
        />

        {/* Card Content Overlay: Title FIRST, then 14px date/category */}
        <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 z-20 pointer-events-none">
          <div className="rounded-lg bg-black/80 backdrop-blur-xs p-3 space-y-1.5 ring-1 ring-white/10 shadow-lg">
            <h3 className="text-[18px] sm:text-[19px] font-semibold text-white leading-snug line-clamp-2">
              {item.title}
            </h3>
            <div className="flex items-center justify-between gap-2 text-[14px] text-white">
              <span className="font-semibold text-white/95">{item.category}</span>
              <time dateTime={item.date} className="text-[14px] text-white/85 font-mono">
                {formatDisplayDate(item.date)}
              </time>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}
