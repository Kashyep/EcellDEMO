"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { useTheme } from "@/components/theme-provider";
import { Auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export function LandingHeader() {
  const { user, loading } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    try {
      if (typeof Auth?.logout === "function") {
        await Auth.logout();
      }
    } catch {
      // Fallback redirect if error occurs
    }
    window.location.reload();
  };

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  };

  return (
    <>
      {/* Accessible skip link */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand Logo & Name */}
          <a
            href="/"
            className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md p-1"
            aria-label="E-Cell SMVIT home"
          >
            {/* Local logos: black for light mode, white for dark mode */}
            <img
              src="/img/logo-black.svg"
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 object-contain dark:hidden"
            />
            <img
              src="/img/logo-white.png"
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 object-contain hidden dark:block"
            />
            <span className="font-heading font-black tracking-wider text-base sm:text-lg select-none">
              E-CELL SMVIT
            </span>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium" aria-label="Main Navigation">
            <a
              href="#about"
              className="text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm px-1"
            >
              About
            </a>
            <a
              href="#programs"
              className="text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm px-1"
            >
              Programs
            </a>
            <a
              href="#gallery"
              className="text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm px-1"
            >
              Gallery
            </a>
            <a
              href="#team"
              className="text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm px-1"
            >
              Team
            </a>
          </nav>

          {/* Action Items: Auth Buttons + Theme Toggle */}
          <div className="flex items-center gap-3">
            {/* Auth-aware controls */}
            {mounted && !loading ? (
              user ? (
                <div className="flex items-center gap-2">
                  <a
                    href="/dashboard"
                    className="inline-flex items-center justify-center text-sm font-medium h-9 px-3.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Dashboard
                  </a>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="h-9 px-3 text-xs sm:text-sm font-medium"
                  >
                    Log out
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <a
                    href="/login"
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Log in
                  </a>
                  <a
                    href="/signup"
                    className="inline-flex items-center justify-center text-sm font-medium h-9 px-3.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Join E-Cell
                  </a>
                </div>
              )
            ) : (
              // Subtle placeholder during initial hydration
              <div className="h-9 w-24 rounded-md bg-muted/30 animate-pulse hidden sm:block" />
            )}

            {/* Theme Toggle Button */}
            {mounted && (
              <button
                type="button"
                onClick={toggleTheme}
                className="relative inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Toggle theme"
                title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
              >
                {theme === "dark" ? (
                  // Sun icon for dark mode
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                  </svg>
                ) : (
                  // Moon icon for light mode
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                )}
              </button>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-border bg-background px-4 py-3 space-y-2">
            <nav className="flex flex-col space-y-2 text-sm font-medium">
              <a
                href="#about"
                onClick={() => setMobileMenuOpen(false)}
                className="px-2 py-1.5 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                About
              </a>
              <a
                href="#programs"
                onClick={() => setMobileMenuOpen(false)}
                className="px-2 py-1.5 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Programs
              </a>
              <a
                href="#gallery"
                onClick={() => setMobileMenuOpen(false)}
                className="px-2 py-1.5 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Gallery
              </a>
              <a
                href="#team"
                onClick={() => setMobileMenuOpen(false)}
                className="px-2 py-1.5 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Team
              </a>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}

export default LandingHeader;
