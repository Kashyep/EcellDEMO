"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/toast-provider";
import { Auth } from "@/lib/auth";
import { Num } from "@/components/num";

const STEPS = [
  { id: "joined", title: "Join E-Cell", hint: "Done when you created your account." },
  { id: "thesis", title: "Write your one-line idea", hint: "Who has the problem, and why now?" },
  { id: "users", title: "Talk to five potential users", hint: "Ask about their problem, not your solution." },
  { id: "build", title: "Join a hackathon team", hint: "Ship a prototype someone can click." },
  { id: "pitch", title: "Pitch at an E-Cell event", hint: "Three minutes, one ask." },
] as const;

export function MemberView() {
  const { user, refresh } = useAuth();
  const { showToast } = useToast();

  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    joined: true,
  });

  useEffect(() => {
    if (user && user.checklist) {
      setChecklist({ ...user.checklist, joined: true });
    }
  }, [user]);

  if (!user) return null;

  const first = user.name.split(" ")[0];
  const memberSince = new Date(user.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const completedCount = STEPS.filter((s) => !!checklist[s.id]).length;
  const progressPercent = Math.round((completedCount / STEPS.length) * 100);

  const handleToggle = async (stepId: string) => {
    if (stepId === "joined") return;

    const previousValue = !!checklist[stepId];
    const nextValue = !previousValue;
    const updated = { ...checklist, [stepId]: nextValue };

    // Optimistic update
    setChecklist(updated);

    try {
      await Auth.saveChecklist(user.id, updated);
      if (refresh) {
        refresh();
      }
    } catch (err: unknown) {
      // Revert optimistic update
      setChecklist((prev) => ({ ...prev, [stepId]: previousValue }));
      const msg = err instanceof Error ? err.message : "Failed to save checklist state.";
      showToast(`Couldn't save that tick. ${msg}`);
    }
  };

  return (
    <div className="dash-member-view">
      <header style={{ marginBottom: "28px" }}>
        <h1 className="dash-title">Welcome, {first}.</h1>
        <p className="dash-subtitle">
          You&apos;re signed in as {user.email}. This is your E-Cell home base.
        </p>
      </header>

      {/* Founder Member Pass */}
      <div className="dash-card" style={{ marginBottom: "28px" }} aria-label="Member Pass">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 className="dash-section-title" style={{ margin: 0 }}>
            Member Pass
          </h2>
          <span className="dash-badge dash-badge--neutral">Member</span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: "16px",
          }}
        >
          <div>
            <div className="dash-stat-card__label">Full Name</div>
            <div style={{ fontWeight: 600, fontSize: "1rem", marginTop: "4px" }}>
              {user.name}
            </div>
          </div>

          <div>
            <div className="dash-stat-card__label">Member ID</div>
            {/* User memberId in regular font, NOT pixel */}
            <div
              style={{
                fontFamily: "inherit",
                fontWeight: 600,
                fontSize: "1rem",
                marginTop: "4px",
              }}
            >
              {user.memberId || "Pending"}
            </div>
          </div>

          <div>
            <div className="dash-stat-card__label">USN</div>
            <div style={{ fontWeight: 500, fontSize: "0.95rem", marginTop: "4px" }}>
              {user.usn || "Not added"}
            </div>
          </div>

          <div>
            <div className="dash-stat-card__label">Member Since</div>
            <div style={{ fontWeight: 500, fontSize: "0.95rem", marginTop: "4px" }}>
              {memberSince}
            </div>
          </div>
        </div>
      </div>

      {/* Founder 5-Step Checklist */}
      <div className="dash-card" style={{ marginBottom: "28px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          <h2 className="dash-section-title" style={{ margin: 0 }}>
            Founder Checklist
          </h2>

          {/* Numbers only Num count split numerals not '3 / 5' mixed text inside pixel wrapper */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.9rem", fontWeight: 600 }}>
            <Num value={completedCount} />
            <span>/</span>
            <Num value={STEPS.length} />
            <span style={{ color: "var(--dash-ink-muted)", fontWeight: 400, marginLeft: "4px" }}>
              completed
            </span>
          </div>
        </div>

        <div className="dash-progress-bar" role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
          <div
            className="dash-progress-bar__fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <ul className="dash-checklist" aria-label="Founder milestone checklist">
          {STEPS.map((step) => {
            const isChecked = !!checklist[step.id];
            const isJoined = step.id === "joined";

            return (
              <li key={step.id} className="dash-checklist__item">
                <input
                  type="checkbox"
                  id={`step-${step.id}`}
                  checked={isChecked}
                  disabled={isJoined}
                  onChange={() => handleToggle(step.id)}
                  aria-label={step.title}
                />
                <label htmlFor={`step-${step.id}`} className="dash-checklist__text" style={{ cursor: isJoined ? "default" : "pointer" }}>
                  <span className="dash-checklist__title">{step.title}</span>
                  <span className="dash-checklist__desc">{step.hint}</span>
                </label>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Pending Team Note */}
      <div className="dash-card" style={{ background: "var(--dash-surface-subtle)" }}>
        <h3 className="dash-section-title" style={{ fontSize: "1.15rem", marginBottom: "8px" }}>
          Domain Appointments
        </h3>
        <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--dash-ink-muted)", lineHeight: 1.5 }}>
          General Member: Complete the founder checklist above to build your startup foundation. Domain appointments and team tasks will appear once assigned by a domain head.
        </p>
      </div>
    </div>
  );
}
