"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { useTheme } from "@/components/theme-provider";
import { Roles } from "@/lib/roles";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { Num } from "@/components/num";

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { reviewCount } = useDashboard();

  if (!user) {
    return null;
  }

  const role = Roles.normalizeRole(user.designation);
  const isSenior = role === "co_head" || role === "head";

  const handleLogout = async () => {
    try {
      const { Auth } = await import("@/lib/auth");
      await Auth.logout();
    } catch {
      // Session may already be expired
    }
    router.push("/login");
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <nav className="dash-mobile-nav" aria-label="Mobile bottom navigation">
      <Link
        href="/dashboard"
        className={`dash-mobile-nav__link ${
          pathname === "/dashboard" ? "dash-mobile-nav__link--active" : ""
        }`}
        aria-current={pathname === "/dashboard" ? "page" : undefined}
      >
        <span>Dash</span>
      </Link>

      {isSenior && (
        <>
          <Link
            href="/dashboard/team"
            className={`dash-mobile-nav__link ${
              pathname === "/dashboard/team" ? "dash-mobile-nav__link--active" : ""
            }`}
            aria-current={pathname === "/dashboard/team" ? "page" : undefined}
          >
            <span>Team</span>
          </Link>

          <Link
            href="/dashboard/review"
            className={`dash-mobile-nav__link ${
              pathname === "/dashboard/review" ? "dash-mobile-nav__link--active" : ""
            }`}
            aria-current={pathname === "/dashboard/review" ? "page" : undefined}
          >
            <span>Review</span>
            {reviewCount > 0 && (
              <span
                className="dash-mobile-nav__badge"
                aria-label={`${reviewCount} tasks to review`}
              >
                <Num value={reviewCount} />
              </span>
            )}
          </Link>

          <Link
            href="/dashboard/assign"
            className={`dash-mobile-nav__link ${
              pathname === "/dashboard/assign" ? "dash-mobile-nav__link--active" : ""
            }`}
            aria-current={pathname === "/dashboard/assign" ? "page" : undefined}
          >
            <span>Assign</span>
          </Link>
        </>
      )}

      <Link
        href="/"
        className="dash-mobile-nav__link"
        title="Landing page"
        aria-label="Home"
      >
        <span>Home</span>
      </Link>

      <button
        type="button"
        onClick={toggleTheme}
        className="dash-mobile-nav__link"
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      >
        <span>{theme === "dark" ? "☀" : "☾"}</span>
      </button>

      <button
        type="button"
        onClick={handleLogout}
        className="dash-mobile-nav__link"
        aria-label="Log out"
      >
        <span>Logout</span>
      </button>
    </nav>
  );
}

export default MobileNav;
