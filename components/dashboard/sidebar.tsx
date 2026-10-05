"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { useTheme } from "@/components/theme-provider";
import { Roles } from "@/lib/roles";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { Num } from "@/components/num";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { reviewCount } = useDashboard();

  const role = user ? Roles.normalizeRole(user.designation) : "member";
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

  const formattedRole = user
    ? Roles.formatPassRole(user.domain, user.designation)
    : "Member";

  return (
    <aside className="dash-sidebar" aria-label="Sidebar navigation">
      <div className="dash-sidebar__top">
        <Link href="/dashboard" className="dash-sidebar__brand">
          <img
            src={theme === "dark" ? "/img/logo-white.png" : "/img/logo-black.svg"}
            alt=""
            width={26}
            height={26}
            className="dash-sidebar__logo"
          />
          <span className="dash-sidebar__title">E-Cell SMVIT</span>
        </Link>

        <nav className="dash-sidebar__nav" aria-label="Main menu">
          <Link
            href="/dashboard"
            className={`dash-sidebar__link ${
              pathname === "/dashboard" ? "dash-sidebar__link--active" : ""
            }`}
            aria-current={pathname === "/dashboard" ? "page" : undefined}
          >
            <span>Dashboard</span>
          </Link>

          {isSenior && (
            <>
              <Link
                href="/dashboard/team"
                className={`dash-sidebar__link ${
                  pathname === "/dashboard/team" ? "dash-sidebar__link--active" : ""
                }`}
                aria-current={pathname === "/dashboard/team" ? "page" : undefined}
              >
                <span>Team</span>
              </Link>

              <Link
                href="/dashboard/review"
                className={`dash-sidebar__link ${
                  pathname === "/dashboard/review" ? "dash-sidebar__link--active" : ""
                }`}
                aria-current={pathname === "/dashboard/review" ? "page" : undefined}
              >
                <span>Review</span>
                {reviewCount > 0 && (
                  <span
                    className="dash-sidebar__badge"
                    aria-label={`${reviewCount} tasks to review`}
                  >
                    <Num value={reviewCount} />
                  </span>
                )}
              </Link>

              <Link
                href="/dashboard/assign"
                className={`dash-sidebar__link ${
                  pathname === "/dashboard/assign" ? "dash-sidebar__link--active" : ""
                }`}
                aria-current={pathname === "/dashboard/assign" ? "page" : undefined}
              >
                <span>Assign</span>
              </Link>
            </>
          )}
        </nav>
      </div>

      <div className="dash-sidebar__bottom">
        {user && (
          <div className="dash-sidebar__user">
            <span className="dash-sidebar__user-name" title={user.name}>
              {user.name}
            </span>
            <span className="dash-sidebar__user-role">{formattedRole}</span>
            <span className="dash-sidebar__user-id">
              ID: {user.memberId || "Pending"}
            </span>
          </div>
        )}

        <div className="dash-sidebar__actions">
          <button
            type="button"
            className="dash-sidebar__btn"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          >
            {theme === "dark" ? "☀ Light" : "☾ Dark"}
          </button>

          <button
            type="button"
            className="dash-sidebar__btn"
            onClick={handleLogout}
            aria-label="Log out of E-Cell dashboard"
          >
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
