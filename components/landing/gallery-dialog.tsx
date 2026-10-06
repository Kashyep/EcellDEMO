"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { type GalleryItem, formatDisplayDate, isUpcoming } from "@/lib/gallery";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { buttonVariants } from "@/components/ui/button";
import { Camera, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GalleryDialogProps {
  item: GalleryItem | null;
  todayKolkata: string;
  onClose: () => void;
}

function BrandedDialogFallback({ item }: { item: GalleryItem }) {
  return (
    <div className="relative aspect-[4/5] max-h-[60vh] max-w-sm sm:max-w-md mx-auto w-full overflow-hidden rounded-lg bg-primary bg-gradient-to-br from-primary via-blue-700 to-indigo-900 p-6 sm:p-8 flex flex-col justify-between text-white select-none ring-1 ring-white/20 shadow-md">
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-indigo-950/40 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative z-10 flex items-center justify-between">
        <Image
          src="/img/logo-white.png"
          alt=""
          width={130}
          height={32}
          className="h-8 sm:h-9 w-auto object-contain opacity-95 drop-shadow"
        />
        <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-mono font-medium tracking-wider text-white uppercase backdrop-blur-xs">
          {item.category}
        </span>
      </div>

      <div className="relative z-10 my-auto py-4">
        <span className="text-xs font-mono uppercase tracking-widest text-white/80 font-bold block mb-1">
          Campus Event
        </span>
        <h3 className="text-2xl sm:text-3xl font-bold font-heading text-white tracking-tight leading-tight">
          {item.title}
        </h3>
      </div>

      <div className="relative z-10 text-xs font-mono text-white/80">
        Sir M. Visvesvaraya Institute of Technology
      </div>
    </div>
  );
}

export function GalleryDialog({ item, todayKolkata, onClose }: GalleryDialogProps) {
  const [imageError, setImageError] = useState(false);

  // Reset error state when selected item changes
  useEffect(() => {
    setImageError(false);
  }, [item?.id]);

  if (!item) {
    return null;
  }

  const showImage = item.hasLocalImage && !imageError;
  const upcoming = Boolean(todayKolkata && isUpcoming(item.date, todayKolkata));

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-4">
        {/* Large Photo / Branded Fallback: FULL portrait without 16/9 cropping */}
        <div className="w-full flex justify-center">
          {showImage ? (
            <div className="relative aspect-[4/5] max-h-[60vh] w-full max-w-md overflow-hidden rounded-lg bg-neutral-950 ring-1 ring-border/50">
              <Image
                src={item.image}
                alt={item.alt || ""}
                fill
                sizes="(max-width: 768px) 100vw, 448px"
                className="object-contain"
                onError={() => setImageError(true)}
              />
            </div>
          ) : (
            <BrandedDialogFallback item={item} />
          )}
        </div>

        {/* Header Details */}
        <DialogHeader className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-primary">
                {item.category}
              </span>
              <span className="text-xs text-muted-foreground">•</span>
              <time dateTime={item.date} className="text-xs text-muted-foreground font-mono">
                {formatDisplayDate(item.date)}
              </time>
            </div>

            <div className="flex items-center gap-1.5">
              {item.featured ? (
                <span className="rounded-md bg-amber-500/90 px-2 py-0.5 text-[11px] font-semibold text-black shadow-sm">
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

          <DialogTitle className="text-xl sm:text-2xl font-bold font-heading tracking-tight text-foreground text-left">
            {item.title}
          </DialogTitle>
        </DialogHeader>

        {/* Full Caption */}
        <DialogDescription className="text-sm sm:text-base text-muted-foreground leading-relaxed text-left whitespace-pre-line">
          {item.caption}
        </DialogDescription>

        {/* View on Instagram Link (no phone, WhatsApp, or form links) */}
        <div className="pt-2 flex items-center justify-end border-t border-border/50">
          <a
            href={item.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "default" }),
              "inline-flex items-center gap-2 motion-reduce:transition-none"
            )}
          >
            <Camera className="size-4" />
            <span>View on Instagram</span>
            <ExternalLink className="size-3.5 opacity-70" />
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
