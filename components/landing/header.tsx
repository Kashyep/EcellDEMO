"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/auth-provider";
import { Auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  MobileNavHeader,
  MobileNavMenu,
  MobileNavToggle,
  NavbarLogo,
} from "@/components/ui/resizable-navbar";

const navItems = [
  { name: "About", link: "#about" },
  { name: "Programs", link: "#programs" },
  { name: "Gallery", link: "#gallery" },
  { name: "Team", link: "#team" },
];

export function LandingHeader() {
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
        toggleRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

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

  return (
    <>
      {/* Accessible skip link */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Skip to content
      </a>

      <Navbar>
        <NavBody>
          <NavbarLogo />
          <NavItems items={navItems} />

          <div className="relative z-20 flex items-center gap-3">
            <ThemeToggle />

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
          </div>
        </NavBody>

        <MobileNav>
          <MobileNavHeader>
            <NavbarLogo />
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <MobileNavToggle
                ref={toggleRef}
                isOpen={mobileMenuOpen}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-nav-menu"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              />
            </div>
          </MobileNavHeader>

          <MobileNavMenu
            id="mobile-nav-menu"
            isOpen={mobileMenuOpen}
            onClose={() => setMobileMenuOpen(false)}
          >
            <nav className="flex flex-col w-full space-y-2 text-sm font-medium" aria-label="Mobile Navigation">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  href={item.link}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-md text-foreground hover:bg-muted transition-colors"
                >
                  {item.name}
                </a>
              ))}
            </nav>

            <div className="w-full pt-4 border-t border-border flex flex-col gap-2">
              {mounted && !loading ? (
                user ? (
                  <>
                    <a
                      href="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="inline-flex items-center justify-center w-full text-sm font-medium h-9 px-3.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      Dashboard
                    </a>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full h-9 text-sm font-medium"
                    >
                      Log out
                    </Button>
                  </>
                ) : (
                  <>
                    <a
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="inline-flex items-center justify-center w-full text-sm font-medium h-9 px-3.5 rounded-md border border-border bg-card text-foreground hover:bg-muted transition-colors"
                    >
                      Log in
                    </a>
                    <a
                      href="/signup"
                      onClick={() => setMobileMenuOpen(false)}
                      className="inline-flex items-center justify-center w-full text-sm font-medium h-9 px-3.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                    >
                      Join E-Cell
                    </a>
                  </>
                )
              ) : (
                <div className="h-9 w-full rounded-md bg-muted/30 animate-pulse" />
              )}
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>
    </>
  );
}

export default LandingHeader;
