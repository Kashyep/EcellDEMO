"use client";

import React, { useState, useEffect } from "react";

export function LandingFooter() {
  const [timeStr, setTimeStr] = useState<string>("--:--:--");
  const [yearStr, setYearStr] = useState<number>(2026);

  useEffect(() => {
    setYearStr(new Date().getFullYear());
    const formatter = new Intl.DateTimeFormat("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "Asia/Kolkata",
    });

    const updateClock = () => {
      setTimeStr(formatter.format(new Date()));
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="border-t border-border/80 bg-card py-16 text-foreground" aria-labelledby="footer-heading">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Pre-Footer Action Banner */}
        <div className="rounded-2xl border border-border bg-muted/30 p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h2 id="footer-heading" className="text-2xl sm:text-4xl font-heading font-black tracking-tight text-foreground">
              Build something before you graduate.
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Take the first step. Join SMVIT&apos;s community of student founders and makers.
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-center">
            <a
              href="/signup"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span>Join E-Cell</span>
              <span aria-hidden="true">→</span>
            </a>
            <a
              href="/login"
              className="inline-flex items-center justify-center px-5 py-3 rounded-lg border border-border bg-card hover:bg-accent text-foreground font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Log in
            </a>
          </div>
        </div>

        {/* Footer Navigation Columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand & Campus Column */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <img
                src="/img/logo-black.svg"
                alt=""
                width={28}
                height={28}
                className="h-7 w-7 object-contain dark:hidden"
              />
              <img
                src="/img/logo-white.png"
                alt=""
                width={28}
                height={28}
                className="h-7 w-7 object-contain hidden dark:block"
              />
              <span className="font-heading font-black tracking-wider text-base text-foreground">
                E-CELL SMVIT
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Sir M. Visvesvaraya Institute of Technology, Hunasamaranahalli, Bengaluru, Karnataka 562157
            </p>
            <div className="pt-2 font-mono text-xs text-muted-foreground">
              <span className="uppercase tracking-wider text-[10px] text-muted-foreground/80 block">Campus Time (IST)</span>
              <span className="font-semibold text-foreground tracking-widest">{timeStr}</span>
            </div>
          </div>

          {/* Explore Links */}
          <nav className="space-y-3" aria-label="Explore Links">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">Explore</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#about" className="hover:text-foreground transition-colors">
                  About
                </a>
              </li>
              <li>
                <a href="#programs" className="hover:text-foreground transition-colors">
                  Programs
                </a>
              </li>
              <li>
                <a href="#gallery" className="hover:text-foreground transition-colors">
                  Gallery
                </a>
              </li>
              <li>
                <a href="#team" className="hover:text-foreground transition-colors">
                  Team
                </a>
              </li>
            </ul>
          </nav>

          {/* Account Links */}
          <nav className="space-y-3" aria-label="Account Links">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">Account</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="/signup" className="hover:text-foreground transition-colors">
                  Sign up
                </a>
              </li>
              <li>
                <a href="/login" className="hover:text-foreground transition-colors">
                  Log in
                </a>
              </li>
              <li>
                <a href="/dashboard" className="hover:text-foreground transition-colors">
                  Member Dashboard
                </a>
              </li>
            </ul>
          </nav>

          {/* Social Links */}
          <nav className="space-y-3" aria-label="Social Media Links">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">Connect</h3>
            <ul className="space-y-2 text-sm text-muted-foreground font-mono text-xs">
              <li>
                <a
                  href="https://www.linkedin.com/company/e-cell-sirmvit"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <span>LinkedIn</span>
                  <span aria-hidden="true">↗</span>
                </a>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/ecellsmvit"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <span>Instagram</span>
                  <span aria-hidden="true">↗</span>
                </a>
              </li>
              <li>
                <a
                  href="https://twitter.com/ecellsmvit"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <span>X / Twitter</span>
                  <span aria-hidden="true">↗</span>
                </a>
              </li>
            </ul>
          </nav>
        </div>

        {/* Wordmark Graphic Banner: white with E-CELL SMVIT name */}
        <div className="pt-6 border-t border-border/40 select-none overflow-hidden" aria-hidden="true">
          <p className="font-heading font-black text-center text-4xl sm:text-6xl md:text-8xl lg:text-9xl tracking-tight text-foreground/15 dark:text-foreground/20 uppercase whitespace-nowrap">
            E-CELL SMVIT
          </p>
        </div>

        {/* Base Copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-muted-foreground pt-4 border-t border-border/40">
          <span>© {yearStr} E-Cell SMVIT. All rights reserved.</span>
          <span>Made by students, for builders.</span>
        </div>
      </div>
    </footer>
  );
}

export default LandingFooter;
