"use client";

import React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { DashboardSearch } from "@/components/dashboard/command-palette";

/**
 * The dashboard's top row: sidebar toggle + page title on the left, wide search +
 * theme toggle on the right, on the page background (no separate header strip).
 */
export function DashboardPageHeader({
  title,
  subtitle,
  aside,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Optional element shown next to the title (e.g. a count badge). */
  aside?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
      <div className="flex min-w-0 items-start gap-2">
        <SidebarTrigger className="mt-1 shrink-0" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="dash-title" style={{ margin: 0 }}>
              {title}
            </h1>
            {aside}
          </div>
          {subtitle ? (
            <p className="dash-subtitle" style={{ marginTop: "6px" }}>
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex w-full items-center gap-2 sm:w-auto">
        <DashboardSearch className="flex-1 sm:flex-none" />
        <ThemeToggle className="shrink-0" />
      </div>
    </header>
  );
}

export default DashboardPageHeader;
