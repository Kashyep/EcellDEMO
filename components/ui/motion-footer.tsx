"use client";

import * as React from "react";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowUp, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/*
 * Cinematic "curtain reveal" footer, adapted from the 21st.dev motion-footer:
 * - styles live in app/globals.css (.cinematic-footer*) and keyframes in tailwind.config.ts
 *   (Tailwind 3; site HSL tokens instead of Tailwind 4 oklch variables),
 * - content comes from props,
 * - prefers-reduced-motion: no GSAP scrub, no magnetic hover, no CSS animations (final state),
 * - magnetic hover only on fine pointers.
 */

const canHover = () => window.matchMedia("(hover: hover) and (pointer: fine)").matches;

type MagneticProps =
  | ({ as: "a" } & React.AnchorHTMLAttributes<HTMLAnchorElement>)
  | ({ as?: "button" } & React.ButtonHTMLAttributes<HTMLButtonElement>);

/** Pill that follows the cursor slightly (GSAP), springing back on leave. */
export function MagneticButton({ className, children, ...props }: MagneticProps) {
  const ref = useRef<HTMLElement | null>(null);
  const reduceMotion = useReducedMotionSafe();

  useEffect(() => {
    const element = ref.current;
    if (!element || reduceMotion || !canHover()) return;

    const onMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      gsap.to(element, {
        x: x * 0.4,
        y: y * 0.4,
        rotationX: -y * 0.15,
        rotationY: x * 0.15,
        scale: 1.05,
        ease: "power2.out",
        duration: 0.4,
      });
    };
    const onLeave = () => {
      gsap.to(element, {
        x: 0,
        y: 0,
        rotationX: 0,
        rotationY: 0,
        scale: 1,
        ease: "elastic.out(1, 0.3)",
        duration: 1.2,
      });
    };

    element.addEventListener("mousemove", onMove);
    element.addEventListener("mouseleave", onLeave);
    return () => {
      element.removeEventListener("mousemove", onMove);
      element.removeEventListener("mouseleave", onLeave);
      gsap.killTweensOf(element);
      gsap.set(element, { clearProps: "transform" });
    };
  }, [reduceMotion]);

  const classes = cn("cursor-pointer", className);

  if (props.as === "a") {
    const { as: _as, ...anchorProps } = props;
    return (
      <a ref={(node) => { ref.current = node; }} className={classes} {...anchorProps}>
        {children}
      </a>
    );
  }
  const { as: _as, type = "button", ...buttonProps } = props;
  return (
    <button ref={(node) => { ref.current = node; }} type={type} className={classes} {...buttonProps}>
      {children}
    </button>
  );
}

export interface CinematicFooterLink {
  label: string;
  href: string;
  icon?: LucideIcon;
  external?: boolean;
}

export interface CinematicFooterProps {
  heading: React.ReactNode;
  headingId?: string;
  description?: React.ReactNode;
  /** Words for the diagonal marquee (decorative, hidden from screen readers). */
  marqueeItems: readonly string[];
  /** Giant outlined text behind the content (decorative). */
  giantText: string;
  primaryLinks: readonly CinematicFooterLink[];
  secondaryLinks: readonly CinematicFooterLink[];
  /** Left side of the bottom bar. */
  meta?: React.ReactNode;
  /** Centre badge of the bottom bar. */
  badge?: React.ReactNode;
  className?: string;
}

function PillLink({ link, primary }: { link: CinematicFooterLink; primary?: boolean }) {
  const Icon = link.icon;
  return (
    <MagneticButton
      as="a"
      href={link.href}
      {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={cn(
        "cinematic-footer-pill group flex items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        primary
          ? "gap-2.5 px-6 py-3.5 text-sm font-bold text-foreground sm:px-10 sm:py-5 sm:text-base"
          : "gap-1.5 px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground sm:px-6 sm:py-3 sm:text-sm"
      )}
    >
      {Icon ? (
        <Icon
          aria-hidden="true"
          className={cn(
            "shrink-0 transition-colors group-hover:text-foreground",
            primary ? "size-5 text-primary" : "size-3.5"
          )}
        />
      ) : null}
      {link.label}
      {link.external ? <span className="sr-only"> (opens in a new tab)</span> : null}
    </MagneticButton>
  );
}

function Marquee({ items }: { items: readonly string[] }) {
  const run = (
    <div className="flex items-center gap-10 px-5">
      {items.map((item, i) => (
        <React.Fragment key={item}>
          <span>{item}</span>
          <span className={i % 2 ? "text-[var(--mark)]" : "text-primary/70"}>✦</span>
        </React.Fragment>
      ))}
    </div>
  );
  return (
    <div
      aria-hidden="true"
      className="absolute left-0 top-20 z-10 w-full -rotate-2 scale-110 overflow-hidden border-y border-border/50 bg-background/60 py-3 shadow-2xl backdrop-blur-md sm:top-24 sm:py-4"
    >
      <div className="flex w-max animate-footer-marquee text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground motion-reduce:animate-none md:text-sm">
        {run}
        {run}
      </div>
    </div>
  );
}

export function CinematicFooter({
  heading,
  headingId,
  description,
  marqueeItems,
  giantText,
  primaryLinks,
  secondaryLinks,
  meta,
  badge,
  className,
}: CinematicFooterProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const giantTextRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotionSafe();

  useEffect(() => {
    if (!wrapperRef.current || reduceMotion) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        giantTextRef.current,
        { y: "10vh", scale: 0.8, opacity: 0 },
        {
          y: "0vh",
          scale: 1,
          opacity: 1,
          ease: "power1.out",
          scrollTrigger: { trigger: wrapperRef.current, start: "top 80%", end: "bottom bottom", scrub: 1 },
        }
      );
      gsap.fromTo(
        [headingRef.current, linksRef.current],
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: { trigger: wrapperRef.current, start: "top 40%", end: "bottom bottom", scrub: 1 },
        }
      );
    }, wrapperRef);

    // Content above the footer changes height after hydration (lazy sections, images,
    // dynamic imports), leaving trigger positions stale. Refresh once layout settles, but
    // never mid-scroll: refresh() restores scroll position and would cut smooth scrolls short.
    let pending = false;
    let timer = 0;
    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (!pending) return;
        pending = false;
        ScrollTrigger.refresh();
      }, 250);
    };
    const observer = new ResizeObserver(() => {
      pending = true;
      schedule();
    });
    const onScroll = () => {
      if (pending) schedule();
    };
    observer.observe(document.body);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(timer);
      ctx.revert();
    };
  }, [reduceMotion]);

  // The footer is position:fixed under a clip-path, so focusing a link before the
  // curtain is open would leave focus on something invisible: open the curtain first.
  const revealOnFocus = () => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const rect = wrapper.getBoundingClientRect();
    if (rect.bottom > window.innerHeight + 1 || rect.top > 0) {
      wrapper.scrollIntoView({ block: "end", behavior: reduceMotion ? "auto" : "smooth" });
    }
  };

  return (
    <div
      ref={wrapperRef}
      className={cn("relative h-svh w-full", className)}
      style={{ clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}
    >
      <footer
        aria-labelledby={headingId}
        onFocusCapture={revealOnFocus}
        className="cinematic-footer fixed bottom-0 left-0 flex h-svh w-full flex-col justify-between overflow-hidden bg-background text-foreground"
      >
        <div className="cinematic-footer-aurora pointer-events-none absolute left-1/2 top-1/2 z-0 h-[60vh] w-[80vw] -translate-x-1/2 -translate-y-1/2 animate-footer-breathe rounded-[50%] blur-[80px] motion-reduce:animate-none" />
        <div className="cinematic-footer-grid pointer-events-none absolute inset-0 z-0" />

        <div
          ref={giantTextRef}
          aria-hidden="true"
          className="cinematic-footer-giant pointer-events-none absolute -bottom-[5vh] left-1/2 z-0 -translate-x-1/2 select-none whitespace-nowrap font-heading"
        >
          {giantText}
        </div>

        <Marquee items={marqueeItems} />

        <div className="relative z-10 mx-auto mt-16 flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-5 sm:mt-20 sm:px-6">
          <div ref={headingRef} className="mb-8 text-center sm:mb-12">
            <h2
              id={headingId}
              className="cinematic-footer-glow font-heading text-4xl font-black tracking-tight sm:text-6xl md:text-8xl"
            >
              {heading}
            </h2>
            {description ? (
              <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:mt-4 sm:text-base">{description}</p>
            ) : null}
          </div>

          <div ref={linksRef} className="flex w-full flex-col items-center gap-4 sm:gap-6">
            <div className="flex w-full flex-wrap justify-center gap-3 sm:gap-4">
              {primaryLinks.map((link) => (
                <PillLink key={link.href} link={link} primary />
              ))}
            </div>
            <nav aria-label="Footer" className="w-full">
              <ul className="flex w-full flex-wrap justify-center gap-2 sm:gap-4">
                {secondaryLinks.map((link) => (
                  <li key={link.href}>
                    <PillLink link={link} />
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>

        <div className="relative z-20 flex w-full items-end justify-between gap-4 px-5 pb-5 sm:items-center sm:px-12 sm:pb-8">
          <div className="min-w-0 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground sm:text-xs">
            {meta}
          </div>
          {badge ? (
            <div className="cinematic-footer-pill hidden cursor-default items-center gap-2 rounded-full px-6 py-3 md:flex">
              {badge}
            </div>
          ) : null}
          <MagneticButton
            onClick={() => window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" })}
            aria-label="Back to top"
            className="cinematic-footer-pill group flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:size-12"
          >
            <ArrowUp
              aria-hidden="true"
              className="size-5 transition-transform duration-300 group-hover:-translate-y-1.5 motion-reduce:transition-none"
            />
          </MagneticButton>
        </div>
      </footer>
    </div>
  );
}

export default CinematicFooter;
