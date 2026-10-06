"use client";

import * as React from "react";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe";

const canHover = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(hover: hover) and (pointer: fine)").matches;

type MagneticProps =
  | ({ as: "a" } & React.AnchorHTMLAttributes<HTMLAnchorElement>)
  | ({ as?: "button" } & React.ButtonHTMLAttributes<HTMLButtonElement>);

/** Pill button/link that follows the cursor slightly (GSAP), springing back on leave. */
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
        x: x * 0.35,
        y: y * 0.35,
        rotationX: -y * 0.12,
        rotationY: x * 0.12,
        scale: 1.04,
        ease: "power2.out",
        duration: 0.35,
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
        duration: 1.1,
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
      <a
        ref={(node) => {
          ref.current = node;
        }}
        className={classes}
        {...anchorProps}
      >
        {children}
      </a>
    );
  }
  const { as: _as, type = "button", ...buttonProps } = props;
  return (
    <button
      ref={(node) => {
        ref.current = node;
      }}
      type={type}
      className={classes}
      {...buttonProps}
    >
      {children}
    </button>
  );
}

export interface CinematicPanelLink {
  label: string;
  href: string;
  icon?: LucideIcon;
  external?: boolean;
}

export interface CinematicPanelProps {
  id?: string;
  headingId?: string;
  pill?: React.ReactNode;
  tagline?: React.ReactNode;
  heading: React.ReactNode;
  mantra?: React.ReactNode;
  description?: React.ReactNode;
  marqueeItems?: readonly string[];
  primaryLinks?: readonly CinematicPanelLink[];
  secondaryCta?: { label: string; href: string };
  secondaryLinks?: readonly CinematicPanelLink[];
  meta?: React.ReactNode;
  background?: React.ReactNode;
  intro?: React.ReactNode;
  isSettled?: boolean;
  onFocusCapture?: (e: React.FocusEvent) => void;
  className?: string;
  children?: React.ReactNode;
}

function PillLink({
  link,
  primary,
}: {
  link: CinematicPanelLink;
  primary?: boolean;
}) {
  const Icon = link.icon;
  return (
    <MagneticButton
      as="a"
      href={link.href}
      {...(link.external
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {})}
      className={cn(
        "cinematic-panel-pill group flex items-center rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        primary
          ? "gap-2.5 px-6 py-3.5 text-sm font-bold text-foreground sm:px-8 sm:py-4 sm:text-base border border-primary/25 bg-primary/10 hover:bg-primary/20 hover:border-primary/40"
          : "gap-1.5 px-4 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground sm:px-6 sm:py-3 sm:text-sm border border-border/80 bg-card/60 hover:bg-card/90"
      )}
    >
      {Icon ? (
        <Icon
          aria-hidden="true"
          className={cn(
            "shrink-0 transition-colors group-hover:text-foreground",
            primary ? "size-4 sm:size-5 text-primary" : "size-3.5"
          )}
        />
      ) : null}
      <span>{link.label}</span>
      {link.external ? (
        <span className="sr-only"> (opens in a new tab)</span>
      ) : null}
    </MagneticButton>
  );
}

function Marquee({ items }: { items: readonly string[] }) {
  const run = (
    <div className="flex items-center gap-8 sm:gap-10 px-4 sm:px-5">
      {items.map((item, i) => (
        <React.Fragment key={item}>
          <span>{item}</span>
          <span className={i % 2 ? "text-[var(--mark)]" : "text-primary/70"}>
            ✦
          </span>
        </React.Fragment>
      ))}
    </div>
  );
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute left-0 top-14 sm:top-20 z-10 w-full -rotate-2 scale-105 sm:scale-110 select-none overflow-hidden border-y border-border/50 bg-background/60 py-2.5 sm:py-3.5 shadow-2xl backdrop-blur-md"
    >
      <div className="flex w-max animate-footer-marquee text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground motion-reduce:animate-none md:text-sm">
        {run}
        {run}
      </div>
    </div>
  );
}

export function CinematicPanel({
  id = "hero",
  headingId = "hero-title",
  pill,
  tagline,
  heading,
  mantra,
  description,
  marqueeItems,
  primaryLinks = [],
  secondaryCta,
  secondaryLinks = [],
  meta,
  background,
  intro,
  isSettled = true,
  onFocusCapture,
  className,
  children,
}: CinematicPanelProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const reduceMotion = useReducedMotionSafe();

  const completeEntranceImmediately = () => {
    if (contentRef.current) {
      gsap.killTweensOf(contentRef.current.children);
      gsap.set(contentRef.current.children, {
        y: 0,
        opacity: 1,
        clearProps: "transform,opacity",
      });
    }
  };

  useEffect(() => {
    if (!isSettled || reduceMotion || !contentRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        contentRef.current!.children,
        { y: 28, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.65,
          stagger: 0.08,
          ease: "power2.out",
        }
      );
    }, sectionRef);

    return () => {
      ctx.revert();
    };
  }, [isSettled, reduceMotion]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const handleFocusIn = () => {
      completeEntranceImmediately();
    };

    section.addEventListener("focusin", handleFocusIn);
    return () => {
      section.removeEventListener("focusin", handleFocusIn);
    };
  }, []);

  const handleFocusCapture = (e: React.FocusEvent) => {
    completeEntranceImmediately();
    onFocusCapture?.(e);
  };

  return (
    <section
      ref={sectionRef}
      id={id}
      aria-labelledby={headingId}
      onFocusCapture={handleFocusCapture}
      className={cn(
        "cinematic-panel relative w-full min-h-svh flex flex-col justify-center items-center overflow-hidden bg-background text-foreground px-4 py-20 sm:py-28",
        className
      )}
    >
      {/* Background layer */}
      {background}

      {/* Decorative grid */}
      <div
        aria-hidden="true"
        className="cinematic-panel-grid pointer-events-none absolute inset-0 z-0"
      />

      {/* Diagonal Marquee */}
      {marqueeItems && marqueeItems.length > 0 ? (
        <Marquee items={marqueeItems} />
      ) : null}

      {/* Intro state or Settled Content */}
      {!isSettled && intro ? (
        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center justify-center text-center">
          {intro}
        </div>
      ) : (
        <div
          ref={contentRef}
          className="relative z-10 max-w-4xl mx-auto flex flex-col items-center justify-center text-center space-y-6 w-full"
        >
          {pill ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border/80 bg-card/70 backdrop-blur-md text-xs font-mono text-muted-foreground uppercase tracking-widest shadow-sm">
              {pill}
            </div>
          ) : null}

          <h1
            id={headingId}
            className="font-heading font-black text-4xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight leading-[1.05] text-foreground max-w-4xl [text-wrap:balance]"
          >
            {heading}
          </h1>

          {tagline ? (
            <p className="text-xs sm:text-sm md:text-base font-bold text-primary tracking-widest uppercase">
              {tagline}
            </p>
          ) : null}

          {mantra ? (
            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm md:text-base font-bold text-primary uppercase tracking-wider">
              {mantra}
            </div>
          ) : null}

          {description ? (
            <p className="text-base sm:text-lg md:text-xl text-foreground/85 max-w-2xl mx-auto leading-relaxed">
              {description}
            </p>
          ) : null}

          {/* Primary Magnetic CTA buttons and secondary link */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-2 w-full sm:w-auto">
            {primaryLinks.map((link) => (
              <PillLink key={link.href} link={link} primary />
            ))}

            {secondaryCta ? (
              <a
                href={secondaryCta.href}
                className="cinematic-panel-pill group inline-flex items-center gap-1.5 px-5 py-3 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground rounded-full border border-border/70 bg-card/60 hover:bg-card/90 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span>{secondaryCta.label}</span>
                <ArrowRight
                  aria-hidden="true"
                  className="size-3.5 transition-transform group-hover:translate-x-0.5"
                />
              </a>
            ) : null}

            {secondaryLinks.map((link) => (
              <PillLink key={link.href} link={link} />
            ))}
          </div>

          {meta ? (
            <div className="pt-2 text-xs font-mono text-muted-foreground">
              {meta}
            </div>
          ) : null}

          {children}
        </div>
      )}
    </section>
  );
}

export default CinematicPanel;
