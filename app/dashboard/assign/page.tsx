"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Roles } from "@/lib/roles";
import { AssignView } from "@/components/dashboard/assign-view";

export default function DashboardAssignPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const role = user ? Roles.normalizeRole(user.designation) : "member";
  const isSenior = role === "co_head" || role === "head";

  useEffect(() => {
    // Hidden sections direct URL redirects before data fetch
    if (!loading && user && !isSenior) {
      router.replace("/dashboard");
    }
  }, [loading, user, isSenior, router]);

  if (loading || !user || !isSenior) {
    return null;
  }

  return <AssignView />;
}
