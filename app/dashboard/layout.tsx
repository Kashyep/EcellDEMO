"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { DashboardProvider } from "@/components/dashboard/dashboard-context";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { CommandPalette } from "@/components/dashboard/command-palette";
import "@/components/dashboard/dashboard.css";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading, error } = useAuth();

  useEffect(() => {
    if (!loading && !user && !error) {
      router.replace("/login");
    }
  }, [loading, user, error, router]);

  if (loading) {
    return (
      <div
        className="dash-shell"
        style={{
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <div className="dash-state" role="status" aria-live="polite">
          <div className="dash-spinner" aria-hidden="true" />
          <p className="dash-state__title">Loading E-Cell Dashboard…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <DashboardProvider>
      <SidebarProvider className="dash-shell motion-reduce:transition-none">
        <DashboardSidebar />
        <SidebarInset className="motion-reduce:transition-none">
          <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
            </div>
            <div className="flex items-center gap-2">
              <CommandPalette />
            </div>
          </header>
          <main className="dash-main" id="main-content" tabIndex={-1}>
            <div className="dash-container">{children}</div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </DashboardProvider>
  );
}
