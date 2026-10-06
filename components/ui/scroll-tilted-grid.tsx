"use client";

import { cn } from "@/lib/utils";
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe";
import ReactLenis from "lenis/react";
import {
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export interface ScrollTiltedGridImage {
  src: string;
  alt: string;
  /** Optional readable caption rendered on a scrim over the bottom of the tile. */
  title?: string;
  description?: string;
}

export interface ScrollTiltedGridProps<T = ScrollTiltedGridImage> {
  images?: readonly T[];
  items?: readonly T[];
  renderCard?: (item: T, index: number) => React.ReactNode;
  loop?: boolean;
  initialCycles?: number;
  maxCycles?: number;
  smoothScroll?: boolean;
  aspectRatio?: string;
  perspective?: number;
  maxTilt?: number;
  maxBlur?: number;
  rounded?: string;
  sectionPadding?: string;
  className?: string;
}

type TileVariables = CSSProperties & {
  "--tile-blur": string;
  "--tile-brightness": number;
  "--tile-saturation": number;
  "--tile-transform": string;
  "--tile-image-scale": number;
};

function clamp(value: number, minimum = 0, maximum = 1) {
  return Math.min(maximum, Math.max(minimum, value));
}

function GalleryTile<T>({
  item,
  index,
  aspectRatio,
  perspective,
  maxTilt,
  maxBlur,
  rounded,
  reduceMotion,
  renderCard,
}: {
  item: T;
  index: number;
  aspectRatio: string;
  perspective: number;
  maxTilt: number;
  maxBlur: number;
  rounded: string;
  reduceMotion: boolean;
  renderCard?: (item: T, index: number) => React.ReactNode;
}) {
  const tileRef = useRef<HTMLDivElement>(null);
  const side = index % 2 === 0 ? -1 : 1;

  useEffect(() => {
    const tile = tileRef.current;
    if (!tile || reduceMotion) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = tile.getBoundingClientRect();
      const travel = window.innerHeight + rect.height;
      const position = clamp((window.innerHeight - rect.top) / travel);
      const distance = Math.abs(position - 0.5) * 2;
      const signed = (position - 0.5) * 2;
      const eased = distance * distance * (3 - 2 * distance);
      // Translation, depth, roll, skew and dimming scale with maxTilt so a low tilt keeps tiles readable and within bounds.
      const strength = maxTilt / 62;
      const x = side * eased * 18 * strength;
      const y = -signed * eased * 24 * strength;
      const z = eased * 180 * strength;
      const tilt = -signed * maxTilt;
      const roll = side * signed * 3 * strength;
      const skew = -side * signed * 7 * strength;

      tile.style.setProperty("--tile-blur", `${eased * maxBlur}px`);
      tile.style.setProperty("--tile-brightness", String(1 - eased * 0.5 * strength));
      tile.style.setProperty("--tile-saturation", String(1 - eased * 0.5 * strength));
      tile.style.setProperty("--tile-image-scale", String(1.03 + eased * 0.15));
      tile.style.setProperty(
        "--tile-transform",
        `translate3d(${x}%, ${y}%, ${z}px) rotateX(${tilt}deg) rotateZ(${roll}deg) skewX(${skew}deg)`,
      );
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    const resizeObserver = new ResizeObserver(schedule);
    resizeObserver.observe(tile);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [maxBlur, maxTilt, reduceMotion, side]);

  const variables: TileVariables = {
    aspectRatio,
    borderRadius: rounded,
    perspective,
    "--tile-blur": "0px",
    "--tile-brightness": 1,
    "--tile-saturation": 1,
    "--tile-transform": "translate3d(0, 0, 0)",
    "--tile-image-scale": 1.03,
  };

  // If a custom renderCard slot is provided, render inside transformed tile container
  // without nested figure/figcaption invalid markup.
  if (renderCard) {
    return (
      <div
        ref={tileRef}
        className={cn("m-0 w-full", side > 0 && "sm:pt-24")}
        style={variables}
      >
        <div
          className={cn(
            "relative w-full overflow-hidden border border-black/10 bg-neutral-200 shadow-[0_24px_80px_rgba(20,18,14,0.16)] dark:border-white/10 dark:bg-neutral-900 dark:shadow-[0_24px_90px_rgba(0,0,0,0.45)]",
            !reduceMotion &&
              "[filter:blur(var(--tile-blur))_brightness(var(--tile-brightness))_saturate(var(--tile-saturation))] [transform:var(--tile-transform)] [transform-style:preserve-3d]",
          )}
          style={{ aspectRatio, borderRadius: rounded }}
        >
          {renderCard(item, index)}
        </div>
      </div>
    );
  }

  // Fallback default image rendering
  const legacyImage = item as unknown as ScrollTiltedGridImage;
  return (
    <figure
      ref={tileRef as unknown as React.RefObject<HTMLElement>}
      className={cn("m-0 w-full", side > 0 && "sm:pt-24")}
      style={variables}
    >
      <div
        className={cn(
          "relative w-full overflow-hidden border border-black/10 bg-neutral-200 shadow-[0_24px_80px_rgba(20,18,14,0.16)] dark:border-white/10 dark:bg-neutral-900 dark:shadow-[0_24px_90px_rgba(0,0,0,0.45)]",
          !reduceMotion &&
            "[filter:blur(var(--tile-blur))_brightness(var(--tile-brightness))_saturate(var(--tile-saturation))] [transform:var(--tile-transform)] [transform-style:preserve-3d]",
        )}
        style={{ aspectRatio, borderRadius: rounded }}
      >
        <img
          src={legacyImage.src}
          alt={legacyImage.alt}
          className={cn(
            "h-full w-full object-cover",
            !reduceMotion && "[transform:scale(var(--tile-image-scale))]",
          )}
          loading={index < 4 ? "eager" : "lazy"}
          draggable={false}
        />
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/10" />
        {legacyImage.title ? (
          <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent px-3 pb-3 pt-10 text-white sm:px-5 sm:pb-5 sm:pt-12">
            <span className="block text-base font-semibold leading-tight sm:text-lg">
              {legacyImage.title}
            </span>
            {legacyImage.description ? (
              <span className="mt-1 hidden text-base leading-snug text-white/85 sm:block">
                {legacyImage.description}
              </span>
            ) : null}
          </figcaption>
        ) : null}
      </div>
    </figure>
  );
}

export function ScrollTiltedGrid<T = ScrollTiltedGridImage>({
  images,
  items,
  renderCard,
  loop = false,
  initialCycles = 2,
  maxCycles = 4,
  smoothScroll = false,
  aspectRatio = "4 / 5",
  perspective = 1200,
  maxTilt = 8,
  maxBlur = 0,
  rounded = "0.75rem",
  sectionPadding = "4vh",
  className,
}: ScrollTiltedGridProps<T>) {
  const reduceMotion = useReducedMotionSafe();
  const rawItems = (items ?? images ?? []) as readonly T[];
  const cycleLimit = Math.max(1, maxCycles);
  const [cycleCount, setCycleCount] = useState(() =>
    clamp(initialCycles, 1, cycleLimit),
  );
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const marker = loadMoreRef.current;
    if (!loop || !marker) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setCycleCount((count) => Math.min(cycleLimit, count + 1));
        }
      },
      { rootMargin: "1200px 0px" },
    );
    observer.observe(marker);
    return () => observer.disconnect();
  }, [cycleLimit, loop]);

  const tiles = useMemo(
    () =>
      Array.from({ length: loop ? cycleCount : 1 }, (_, cycle) =>
        rawItems.map((item, index) => ({ cycle, item, index })),
      ).flat(),
    [cycleCount, rawItems, loop],
  );

  if (reduceMotion) {
    return (
      <div
        className={cn(
          "mx-auto grid w-full max-w-6xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-4",
          className
        )}
      >
        {rawItems.map((item, index) =>
          renderCard ? (
            <div
              key={index}
              className="w-full overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm"
              style={{ aspectRatio, borderRadius: rounded }}
            >
              {renderCard(item, index)}
            </div>
          ) : (
            <figure
              key={index}
              className="relative m-0 w-full overflow-hidden rounded-xl border border-border bg-card shadow-sm"
              style={{ aspectRatio, borderRadius: rounded }}
            >
              <img
                src={(item as unknown as ScrollTiltedGridImage).src}
                alt={(item as unknown as ScrollTiltedGridImage).alt}
                className="h-full w-full object-cover"
              />
              {(item as unknown as ScrollTiltedGridImage).title ? (
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent px-4 pb-4 pt-10 text-white">
                  <span className="block text-base font-semibold leading-tight">
                    {(item as unknown as ScrollTiltedGridImage).title}
                  </span>
                  {(item as unknown as ScrollTiltedGridImage).description ? (
                    <span className="mt-1 block text-sm leading-snug text-white/85">
                      {(item as unknown as ScrollTiltedGridImage).description}
                    </span>
                  ) : null}
                </figcaption>
              ) : null}
            </figure>
          )
        )}
      </div>
    );
  }

  const gallery = (
    <section
      className={cn("relative w-full overflow-hidden", className)}
      aria-label="Campus Moments Gallery"
    >
      <div
        className="mx-auto grid w-full max-w-5xl grid-cols-1 sm:grid-cols-2 items-start gap-x-6 gap-y-12 px-4 sm:gap-x-10 sm:gap-y-24 sm:px-8 lg:gap-x-16"
        style={{ paddingBlock: sectionPadding }}
      >
        {tiles.map(({ cycle, item, index }) => (
          <GalleryTile
            key={`${cycle}-${index}`}
            item={item}
            index={index}
            aspectRatio={aspectRatio}
            perspective={perspective}
            maxTilt={maxTilt}
            maxBlur={maxBlur}
            rounded={rounded}
            reduceMotion={reduceMotion}
            renderCard={renderCard}
          />
        ))}
      </div>
      {loop && cycleCount < cycleLimit ? (
        <div ref={loadMoreRef} className="h-px" aria-hidden />
      ) : null}
    </section>
  );

  return smoothScroll && !reduceMotion ? (
    <ReactLenis
      root
      options={{ autoRaf: true, lerp: 0.075, wheelMultiplier: 0.85 }}
    >
      {gallery}
    </ReactLenis>
  ) : (
    gallery
  );
}

export default ScrollTiltedGrid;
