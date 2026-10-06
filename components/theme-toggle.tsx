"use client";

import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

/** Site theme toggle: the ThemeProvider stays the single source of truth. */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const label = theme === "dark" ? "Switch to light theme" : "Switch to dark theme";

  return (
    <AnimatedThemeToggler
      theme={theme}
      onThemeChange={setTheme}
      variant="circle"
      duration={400}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&_svg]:h-4 [&_svg]:w-4",
        className
      )}
    />
  );
}

export default ThemeToggle;
