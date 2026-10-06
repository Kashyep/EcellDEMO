"use client";

import { ArrowUpRight, Heart, LogIn, UserPlus } from "lucide-react";
import { CinematicFooter, type CinematicFooterLink } from "@/components/ui/motion-footer";

const PRIMARY_LINKS: CinematicFooterLink[] = [
  { label: "Join E-Cell", href: "/signup", icon: UserPlus },
  { label: "Log in", href: "/login", icon: LogIn },
];

const SECONDARY_LINKS: CinematicFooterLink[] = [
  { label: "About", href: "#about" },
  { label: "Programs", href: "#programs" },
  { label: "Gallery", href: "#gallery" },
  { label: "Team", href: "#team" },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/e-cell-sirmvit", icon: ArrowUpRight, external: true },
  { label: "Instagram", href: "https://www.instagram.com/ecellsmvit", icon: ArrowUpRight, external: true },
  { label: "X / Twitter", href: "https://twitter.com/ecellsmvit", icon: ArrowUpRight, external: true },
];

const MARQUEE = ["Ideathons", "Workshops", "Hackathons", "E-Summit", "Student founders", "Sir MVIT Bengaluru"];

export function LandingFooter() {
  return (
    <CinematicFooter
      headingId="footer-heading"
      heading="Build something before you graduate."
      description="Join SMVIT's community of student founders and makers."
      giantText="E-CELL"
      marqueeItems={MARQUEE}
      primaryLinks={PRIMARY_LINKS}
      secondaryLinks={SECONDARY_LINKS}
      meta={
        <>
          <span suppressHydrationWarning>© {new Date().getFullYear()} E-Cell SMVIT</span>
          <span className="hidden sm:inline"> · Bengaluru</span>
        </>
      }
      badge={
        <>
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Made by students</span>
          <Heart
            aria-label="with love"
            className="size-4 animate-footer-heartbeat fill-[var(--mark)] text-[var(--mark)] motion-reduce:animate-none"
          />
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">for builders</span>
        </>
      }
    />
  );
}

export default LandingFooter;
