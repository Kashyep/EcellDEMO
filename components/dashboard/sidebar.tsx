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
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
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
  SidebarRail,
  SidebarTrigger,
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
    <Sidebar collapsible="icon" className="motion-reduce:transition-none">
      <SidebarHeader className="border-b border-sidebar-border/50 p-2.5">
        <div className="flex items-center justify-between gap-2 group-data-[collapsible=icon]:justify-center">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 overflow-hidden text-sidebar-foreground"
            onClick={handleNavClick}
          >
            <img
              src={theme === "dark" ? "/img/logo-white.png" : "/img/logo-black.svg"}
              alt=""
              width={26}
              height={26}
              className="size-[26px] shrink-0 object-contain"
            />
            <span className="font-condensed text-xl font-bold uppercase tracking-tight group-data-[collapsible=icon]:hidden">
              E-CELL SMVIT
            </span>
          </Link>
          <SidebarTrigger className="hidden md:flex group-data-[collapsible=icon]:hidden" />
        </div>
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
                        tooltip={item.title}
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

      <SidebarFooter className="border-t border-sidebar-border/50 p-2.5">
        {user && (
          <div className="flex flex-col gap-0.5 overflow-hidden group-data-[collapsible=icon]:hidden">
            <span
              className="truncate text-sm font-semibold text-sidebar-foreground"
              title={user.name}
            >
              {user.name}
            </span>
            <span className="truncate text-xs font-medium text-primary">
              {formattedRole}
            </span>
            <span className="truncate text-[11px] text-muted-foreground font-sans">
              ID: {user.memberId || "Pending"}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 pt-1 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center">
          <ThemeToggle />
          <Button
            variant="outline"
            size="sm"
            type="button"
            className="w-full justify-start gap-2 text-xs group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center"
            onClick={handleLogout}
            aria-label="Log out of E-Cell dashboard"
            title="Log out"
          >
            <LogOut className="size-3.5 shrink-0" />
            <span className="group-data-[collapsible=icon]:hidden">Logout</span>
          </Button>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

export { DashboardSidebar as Sidebar };
export default DashboardSidebar;
