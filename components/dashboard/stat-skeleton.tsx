"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function StatCardSkeleton() {
  return (
    <div className="dash-stat-card">
      <Skeleton className="h-8 w-16 mb-2 rounded" />
      <Skeleton className="h-4 w-24 rounded" />
    </div>
  );
}

export function StatGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      className="dash-stats-grid"
      role="region"
      aria-label="Loading statistics"
      style={{ marginBottom: 0 }}
    >
      {Array.from({ length: count }, (_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function TaskListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: "8px" }}
      role="region"
      aria-label="Loading tasks list"
    >
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="dash-task-card"
          style={{ display: "flex", flexDirection: "column", gap: "8px", pointerEvents: "none" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Skeleton className="h-5 w-48 rounded" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <div style={{ display: "flex", gap: "16px" }}>
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-4 w-32 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ReviewListSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: "16px" }}
      role="region"
      aria-label="Loading review queue"
    >
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="dash-card"
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <Skeleton className="h-6 w-56 rounded" />
              <div style={{ display: "flex", gap: "12px" }}>
                <Skeleton className="h-4 w-28 rounded" />
                <Skeleton className="h-4 w-24 rounded" />
              </div>
            </div>
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <Skeleton className="h-14 w-full rounded" />
          <div style={{ display: "flex", gap: "10px" }}>
            <Skeleton className="h-9 w-24 rounded-lg" />
            <Skeleton className="h-9 w-32 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="dash-card" style={{ marginBottom: "24px" }}>
      <Skeleton className="h-6 w-48 mb-4 rounded" />
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {Array.from({ length: rows }, (_, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 14px",
              border: "1px solid var(--dash-border)",
              borderRadius: "var(--dash-radius)",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <Skeleton className="h-5 w-36 rounded" />
              <Skeleton className="h-3 w-24 rounded" />
            </div>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <Skeleton className="h-5 w-12 rounded" />
              <Skeleton className="h-4 w-24 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
