"use client";

import React, { useEffect, useRef } from "react";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/toast-provider";
import { Auth } from "@/lib/auth";
import { Roles } from "@/lib/roles";
import { MemberView } from "@/components/dashboard/member-view";
import { ExecutiveView } from "@/components/dashboard/executive-view";
import { SeniorDashboardView } from "@/components/dashboard/senior-dashboard-view";

export default function DashboardPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const checkedFlashRef = useRef(false);

  useEffect(() => {
    if (!user || checkedFlashRef.current) return;
    checkedFlashRef.current = true;

    // Email confirmation arrival check
    const fromConfirmLink = typeof window !== "undefined" && /type=signup/.test(window.location.hash);
    const first = user.name ? user.name.split(" ")[0] : "Member";

    const flash = Auth.takeFlash() || (fromConfirmLink ? `Email confirmed. Welcome to E-Cell, ${first}!` : null);
    if (flash) {
      showToast(flash);
    }
  }, [user, showToast]);

  if (!user) return null;

  const role = Roles.normalizeRole(user.designation);

  if (role === "member") {
    return <MemberView />;
  }

  if (role === "executive") {
    return <ExecutiveView />;
  }

  return <SeniorDashboardView />;
}
