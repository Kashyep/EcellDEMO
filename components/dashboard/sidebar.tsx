"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  UserPlus,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useTheme } from "@/components/theme-provider";
import { Roles } from "@/lib/roles";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { Num } from "@/components/num";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { reviewCount } = useDashboard();
  const { isMobile, setOpenMobile } = useSidebar();

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

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const formattedRole = user
    ? Roles.formatPassRole(user.domain, user.designation)
    : "Member";

  const navItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    ...(isSenior
      ? [
          {
            title: "Team",
            url: "/dashboard/team",
            icon: Users,
          },
          {
            title: "Review queue",
            url: "/dashboard/review",
            icon: ClipboardCheck,
          },
          {
            title: "Assign task",
            url: "/dashboard/assign",
            icon: UserPlus,
          },
        ]
      : []),
  ];

  return (
    <Sidebar variant="floating" collapsible="offcanvas" className="motion-reduce:transition-none">
      <SidebarHeader className="px-4 pb-2 pt-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 overflow-hidden text-sidebar-foreground"
          onClick={handleNavClick}
        >
          <img
            src={theme === "dark" ? "/img/logo-white.png" : "/img/logo-black.svg"}
            alt=""
            width={22}
            height={22}
            className="size-[22px] shrink-0 object-contain"
          />
          <span className="font-condensed text-lg font-bold uppercase tracking-tight">E-CELL SMVIT</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <nav aria-label="Dashboard">
              <SidebarMenu>
                {navItems.map((item) => {
                  const isActive = pathname === item.url;
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        render={
                          <Link
                            href={item.url}
                            aria-current={isActive ? "page" : undefined}
                            onClick={handleNavClick}
                          />
                        }
                        isActive={isActive}
                        className={cn(
                          "h-9 text-muted-foreground hover:text-sidebar-foreground",
                          "data-active:bg-sidebar-accent data-active:font-medium data-active:text-sidebar-foreground"
                        )}
                      >
                        <item.icon className="size-4 shrink-0" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>

                      {item.url === "/dashboard/review" && reviewCount > 0 && (
                        <SidebarMenuBadge>
                          <Num value={reviewCount} animate="slide" />
                          <span className="sr-only">waiting for review</span>
                        </SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </nav>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <div className="flex items-center gap-2">
          {user && (
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium text-sidebar-foreground" title={user.name}>
                {user.name}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {formattedRole} · {user.memberId || "ID pending"}
              </span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            type="button"
            className="shrink-0 text-muted-foreground hover:text-foreground"
            onClick={handleLogout}
            aria-label="Log out"
            title="Log out"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export { DashboardSidebar as Sidebar };
export default DashboardSidebar;
