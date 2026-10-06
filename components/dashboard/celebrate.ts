"use client";

import confetti from "canvas-confetti";
import type { Task } from "@/lib/types";

/** Short confetti burst; never fires with prefers-reduced-motion. */
export async function fireConfetti() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  await confetti({
    particleCount: 70,
    spread: 60,
    origin: { y: 0.65 },
    disableForReducedMotion: true,
  });
}

/**
 * Fires confetti when one of the Executive's tasks became approved since the
 * last visit. Last-seen approved task IDs live in localStorage; the first visit
 * only records the baseline.
 */
export function checkAndCelebrateExecutiveApprovals(userId: string, tasks: Task[]) {
  const storageKey = `ecell-last-seen-approved:${userId}`;
  const approvedIds = tasks.filter((t) => t.status === "approved").map((t) => t.id);

  let seen: string[] | null = null;
  try {
    const stored = localStorage.getItem(storageKey);
    seen = stored ? (JSON.parse(stored) as string[]) : null;
  } catch {
    seen = null;
  }

  localStorage.setItem(storageKey, JSON.stringify(approvedIds));

  if (seen && approvedIds.some((id) => !seen.includes(id))) {
    void fireConfetti();
  }
}
