"use client";

import React, { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "motion/react";
import { useReducedMotionSafe } from "@/hooks/use-reduced-motion-safe";

interface NavbarProps {
  children: React.ReactNode;
  className?: string;
}

interface NavBodyProps {
  children: React.ReactNode;
  className?: string;
  visible?: boolean;
}

interface NavItemsProps {
  items: {
    name: string;
    link: string;
  }[];
  className?: string;
  onItemClick?: () => void;
}

interface MobileNavProps {
  children: React.ReactNode;
  className?: string;
  visible?: boolean;
}

interface MobileNavHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface MobileNavMenuProps {
  children: React.ReactNode;
  className?: string;
  isOpen: boolean;
  onClose?: () => void;
  id?: string;
}

export const Navbar = ({ children, className }: NavbarProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const [visible, setVisible] = useState<boolean>(false);
  const shouldReduceMotion = useReducedMotionSafe();

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (shouldReduceMotion) {
      if (visible) setVisible(false);
      return;
    }
    if (latest > 60) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  });

  return (
    <motion.div
      ref={ref}
      className={cn("sticky inset-x-0 top-0 z-40 w-full", className)}
    >
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(
              child as React.ReactElement<{ visible?: boolean }>,
              { visible: shouldReduceMotion ? false : visible },
            )
          : child,
      )}
    </motion.div>
  );
};

export const NavBody = ({ children, className, visible }: NavBodyProps) => {
  const shouldReduceMotion = useReducedMotionSafe();

  return (
    <motion.div
      animate={
        shouldReduceMotion
          ? { width: "100%", y: 0 }
          : {
              backdropFilter: visible ? "blur(12px)" : "none",
              boxShadow: visible
                ? "0 4px 20px -2px rgba(0, 0, 0, 0.1), 0 2px 6px -1px rgba(0, 0, 0, 0.06)"
                : "none",
              width: visible ? "60%" : "100%",
              y: visible ? 10 : 0,
            }
      }
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : {
              type: "spring",
              stiffness: 220,
              damping: 32,
            }
      }
      style={{
        minWidth: shouldReduceMotion ? "auto" : "720px",
      }}
      className={cn(
        "relative z-[60] mx-auto hidden w-full max-w-7xl flex-row items-center justify-between self-start rounded-full bg-transparent px-4 py-2 lg:flex transition-colors duration-200",
        visible && "bg-background/80 backdrop-blur-md border border-border/60",
        className,
      )}
    >
      {children}
    </motion.div>
  );
};

export const NavItems = ({ items, className, onItemClick }: NavItemsProps) => {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <motion.div
      onMouseLeave={() => setHovered(null)}
      className={cn(
        "absolute inset-0 hidden flex-1 flex-row items-center justify-center space-x-1 text-sm font-medium transition duration-200 lg:flex pointer-events-none",
        className,
      )}
    >
      <div className="flex items-center space-x-1 pointer-events-auto">
        {items.map((item, idx) => (
          <a
            key={`link-${idx}`}
            href={item.link}
            onMouseEnter={() => setHovered(idx)}
            onClick={onItemClick}
            className="relative px-3 py-1.5 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
          >
            {hovered === idx && (
              <motion.div
                layoutId="hovered"
                className="absolute inset-0 h-full w-full rounded-full bg-muted/70"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{item.name}</span>
          </a>
        ))}
      </div>
    </motion.div>
  );
};

export const MobileNav = ({ children, className, visible }: MobileNavProps) => {
  const shouldReduceMotion = useReducedMotionSafe();

  return (
    <motion.div
      animate={
        shouldReduceMotion
          ? { width: "100%", y: 0 }
          : {
              backdropFilter: visible ? "blur(12px)" : "none",
              boxShadow: visible
                ? "0 4px 20px -2px rgba(0, 0, 0, 0.1), 0 2px 6px -1px rgba(0, 0, 0, 0.06)"
                : "none",
              width: visible ? "94%" : "100%",
              paddingRight: visible ? "12px" : "0px",
              paddingLeft: visible ? "12px" : "0px",
              borderRadius: visible ? "12px" : "0px",
              y: visible ? 8 : 0,
            }
      }
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : {
              type: "spring",
              stiffness: 220,
              damping: 32,
            }
      }
      className={cn(
        "relative z-50 mx-auto flex w-full max-w-[calc(100vw-1rem)] flex-col items-center justify-between bg-transparent px-3 py-2 lg:hidden transition-colors duration-200",
        visible && "bg-background/80 backdrop-blur-md border border-border/60",
        className,
      )}
    >
      {children}
    </motion.div>
  );
};

export const MobileNavHeader = ({
  children,
  className,
}: MobileNavHeaderProps) => {
  return (
    <div
      className={cn(
        "flex w-full flex-row items-center justify-between",
        className,
      )}
    >
      {children}
    </div>
  );
};

export const MobileNavMenu = ({
  children,
  className,
  isOpen,
  onClose,
  id,
}: MobileNavMenuProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id={id}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className={cn(
            "absolute inset-x-0 top-14 z-50 flex w-full flex-col items-start justify-start gap-4 rounded-xl border border-border bg-card p-6 shadow-xl",
            className,
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const MobileNavToggle = React.forwardRef<
  HTMLButtonElement,
  {
    isOpen: boolean;
    onClick: () => void;
    "aria-expanded"?: boolean;
    "aria-controls"?: string;
    "aria-label"?: string;
    className?: string;
  }
>(({ isOpen, onClick, "aria-expanded": ariaExpanded, "aria-controls": ariaControls, "aria-label": ariaLabel, className }, ref) => {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-expanded={ariaExpanded ?? isOpen}
      aria-controls={ariaControls}
      aria-label={ariaLabel ?? (isOpen ? "Close menu" : "Open menu")}
      className={cn(
        "inline-flex items-center justify-center p-2 rounded-md text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors",
        className,
      )}
    >
      {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
    </button>
  );
});
MobileNavToggle.displayName = "MobileNavToggle";

export const NavbarLogo = () => {
  return (
    <a
      href="/"
      className="relative z-20 mr-4 flex items-center space-x-2.5 px-2 py-1 text-sm font-normal text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
      aria-label="E-Cell SMVIT home"
    >
      <img
        src="/img/logo-black.svg"
        alt=""
        width={32}
        height={32}
        className="h-8 w-8 object-contain dark:hidden"
      />
      <img
        src="/img/logo-white.png"
        alt=""
        width={32}
        height={32}
        className="h-8 w-8 object-contain hidden dark:block"
      />
      <span className="font-heading font-black tracking-wider text-base sm:text-lg select-none text-foreground">
        E-CELL SMVIT
      </span>
    </a>
  );
};

export const NavbarButton = ({
  href,
  as: Tag = "a",
  children,
  className,
  variant = "primary",
  ...props
}: {
  href?: string;
  as?: React.ElementType;
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "dark" | "gradient";
} & (
  | React.ComponentPropsWithoutRef<"a">
  | React.ComponentPropsWithoutRef<"button">
)) => {
  const baseStyles =
    "px-4 py-2 rounded-md bg-card text-foreground text-sm font-bold relative cursor-pointer hover:-translate-y-0.5 transition duration-200 inline-block text-center";

  const variantStyles = {
    primary:
      "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
    secondary: "bg-transparent shadow-none hover:bg-muted",
    dark: "bg-panel text-panel-fg shadow-sm hover:opacity-90",
    gradient:
      "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
  };

  return (
    <Tag
      href={href || undefined}
      className={cn(baseStyles, variantStyles[variant], className)}
      {...props}
    >
      {children}
    </Tag>
  );
};
