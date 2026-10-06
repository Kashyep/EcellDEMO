"use client";

import React from "react";
import Image from "next/image";
import { ArrowUpRight, Heart } from "lucide-react";

const NAV_LINKS = [
  { label: "About", href: "#about" },
  { label: "Programs", href: "#programs" },
  { label: "Gallery", href: "#gallery" },
  { label: "Team", href: "#team" },
];

const SOCIAL_LINKS = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/ecell_smvit/",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/e-cell-sirmvit",
  },
];

export function LandingFooter() {
  return (
    <footer className="w-full border-t border-border/60 bg-card/40 backdrop-blur-md py-8 sm:py-10 text-foreground">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-6">
        {/* Top bar: Brand + Nav links + Social links */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* E-Cell logo and name */}
          <a
            href="#hero"
            className="inline-flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md w-fit"
            aria-label="E-Cell SMVIT home"
          >
            <Image
              src="/img/logo-black.svg"
              alt=""
              width={30}
              height={30}
              className="h-7 w-7 sm:h-8 sm:w-8 object-contain dark:hidden"
            />
            <Image
              src="/img/logo-white.png"
              alt=""
              width={30}
              height={30}
              className="h-7 w-7 sm:h-8 sm:w-8 object-contain hidden dark:block"
            />
            <span className="font-heading font-black tracking-wider text-base sm:text-lg select-none text-foreground">
              E-CELL SMVIT
            </span>
          </a>

          {/* Navigation links */}
          <nav aria-label="Footer navigation">
            <ul className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm font-medium text-muted-foreground">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Verified Social links */}
          <div className="flex items-center gap-4 sm:gap-5 text-sm font-medium text-muted-foreground">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
              >
                <span>{social.label}</span>
                <ArrowUpRight aria-hidden="true" className="size-3.5 shrink-0 opacity-70" />
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-border/40" />

        {/* Bottom bar: Copyright & Made by students badge */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-muted-foreground">
          <div suppressHydrationWarning>
            © {new Date().getFullYear()} E-Cell SMVIT · Bengaluru
          </div>

          {/* Made by students badge */}
          <div className="inline-flex items-center gap-1.5 font-bold uppercase tracking-widest text-[11px] sm:text-xs">
            <span>Made by students</span>
            <Heart
              aria-label="with love"
              className="size-3.5 fill-[var(--mark)] text-[var(--mark)] animate-footer-heartbeat motion-reduce:animate-none"
            />
            <span>for builders</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default LandingFooter;
