"use client";

import { useEffect, useState } from "react";

/**
 * `prefers-reduced-motion: reduce`, read after mount so the server render and
 * the first client render always match (no hydration mismatch).
 */
export function useReducedMotionSafe(): boolean {
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setReduce(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return reduce;
}
