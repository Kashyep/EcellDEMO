"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { DashboardProvider } from "@/components/dashboard/dashboard-context";
import { Sidebar } from "@/components/dashboard/sidebar";
import { MobileNav } from "@/components/dashboard/mobile-nav";
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
      <div className="dash-shell">
        <Sidebar />
        <main className="dash-main" id="main-content" tabIndex={-1}>
          <div className="dash-container">{children}</div>
        </main>
        <MobileNav />
      </div>
    </DashboardProvider>
  );
}
