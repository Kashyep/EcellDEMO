"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Auth, passwordScore, validateSignup } from "@/lib/auth";
import type { SignupErrors } from "@/lib/types";
import { useAuth } from "@/components/auth-provider";
import { useTheme } from "@/components/theme-provider";
import { Sun, Moon, ArrowRight, Mail } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { theme, setTheme } = useTheme();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [usn, setUsn] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<SignupErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [confirmedEmail, setConfirmedEmail] = useState("");

  const score = passwordScore(password);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setFieldErrors({});

    const data = {
      name: name.trim(),
      email: email.trim(),
      usn: usn.trim().toUpperCase(),
      password,
    };

    const errors = validateSignup(data);
    if (!confirm) {
      errors.confirm = "Re-enter your password.";
    } else if (confirm !== password) {
      errors.confirm = "Passwords don't match.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const res = await Auth.signup(data);
      if (res.needsConfirmation) {
        setConfirmedEmail(res.user.email);
        setNeedsConfirmation(true);
      } else {
        const first = res.user.name.split(" ")[0];
        Auth.flash(`Account created. Welcome to E-Cell, ${first}!`);
        router.push("/dashboard");
      }
    } catch (err: any) {
      setSubmitting(false);
      setGeneralError(err?.message || "Failed to create account.");
      if (err?.fields) {
        setFieldErrors(err.fields);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--ink)]">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[var(--bg)]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-4 sm:px-8 py-3">
          <Link href="/" className="inline-flex items-center gap-2 font-display font-extrabold text-base sm:text-lg tracking-tight">
            <img
              src="/img/logo-black.svg"
              alt="E-Cell SMVIT"
              className="h-7 w-auto dark:hidden"
            />
            <img
              src="/img/logo-white.png"
              alt="E-Cell SMVIT"
              className="h-7 w-auto hidden dark:block"
            />
            <span>E-CELL SMVIT</span>
          </Link>
          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-[var(--muted)] hover:text-[var(--ink)] transition-colors px-2 py-1"
            >
              Log in
            </Link>
            <button
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius)] border-[1.5px] border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:border-[var(--ink)] hover:shadow-[2px_2px_0_var(--ink)]"
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
          </nav>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-2">
        {/* Left Side Panel */}
        <aside className="order-2 md:order-1 flex flex-col justify-between gap-8 bg-[var(--panel)] p-8 sm:p-12 lg:p-16 text-[var(--panel-fg)] bg-[linear-gradient(rgba(238,240,245,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(238,240,245,0.06)_1px,transparent_1px)] bg-[size:32px_32px]">
          <div className="flex items-center gap-2">
            <Link href="/" className="inline-flex items-center gap-2 font-display font-extrabold text-lg text-[var(--panel-fg)]">
              <img src="/img/logo-white.png" alt="" className="h-7 w-auto" />
              <span>E-CELL SMVIT</span>
            </Link>
          </div>
          <div className="grid gap-3 max-w-md">
            <span className="font-mono text-xs uppercase tracking-widest opacity-60">Membership</span>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl leading-tight">Your first step on the venture curve.</h2>
            <ol className="mt-4 grid gap-2.5 text-sm sm:text-base opacity-85">
              <li className="flex items-baseline gap-3">
                <span className="font-mono text-xs font-semibold text-[var(--mark)]">01</span>
                <span>Create your account</span>
              </li>
              <li className="flex items-baseline gap-3">
                <span className="font-mono text-xs font-semibold text-[var(--mark)]">02</span>
                <span>Get your E-Cell member ID</span>
              </li>
              <li className="flex items-baseline gap-3">
                <span className="font-mono text-xs font-semibold text-[var(--mark)]">03</span>
                <span>Work through the founder checklist</span>
              </li>
            </ol>
          </div>
          <div className="text-xs font-mono opacity-50">SMVIT Entrepreneurship Cell</div>
        </aside>

        {/* Right Form Card */}
        <div className="order-1 md:order-2 flex items-center justify-center p-6 sm:p-12 lg:p-16">
          <div className="w-full max-w-[420px] grid gap-6">
            <div className="flex items-center gap-2 md:hidden">
              <img src="/img/logo-black.svg" alt="" className="h-6 w-auto dark:hidden" />
              <img src="/img/logo-white.png" alt="" className="h-6 w-auto hidden dark:block" />
              <span className="font-display font-extrabold text-base">E-CELL SMVIT</span>
            </div>

            {needsConfirmation ? (
              <div className="grid gap-4 rounded-[10px] border border-[var(--line)] bg-[var(--surface)] p-6 animate-in fade-in duration-300">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="font-mono text-xs uppercase tracking-wider text-[var(--muted)]">One more step</span>
                    <h2 className="font-display font-extrabold text-2xl">Check your inbox</h2>
                  </div>
                </div>
                <p className="text-sm text-[var(--muted)] leading-relaxed">
                  We sent a confirmation link to <strong className="text-[var(--ink)]">{confirmedEmail}</strong>. Open it on this device and you&apos;ll land on your dashboard, signed in.
                </p>
                <div className="mt-2 pt-4 border-t border-[var(--line)] flex justify-between items-center text-xs text-[var(--muted)]">
                  <span>Didn&apos;t get it? Check spam</span>
                  <Link href="/login" className="font-semibold text-[var(--accent)] hover:underline">
                    Back to log in
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="grid gap-1.5">
                  <span className="font-mono text-xs uppercase tracking-widest text-[var(--muted)]">Sign up</span>
                  <h1 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight">Join E-Cell</h1>
                  <p className="text-sm text-[var(--muted)]">Open to every SMVIT student, any branch, any year.</p>
                </div>

                {generalError && (
                  <div
                    className="rounded-[var(--radius)] border border-[var(--err)] bg-[color-mix(in_srgb,var(--err)_8%,transparent)] p-3 text-sm text-[var(--err)]"
                    role="alert"
                  >
                    {generalError}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
                  <div className="grid gap-1.5">
                    <label htmlFor="name" className="text-sm font-semibold flex justify-between">
                      Full name
                    </label>
                    <input
                      id="name"
                      type="text"
                      name="name"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: "" }));
                      }}
                      autoComplete="name"
                      required
                      aria-invalid={!!fieldErrors.name}
                      aria-describedby={fieldErrors.name ? "name-error" : undefined}
                      className={`w-full rounded-[var(--radius)] border bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)] ${
                        fieldErrors.name ? "border-[var(--err)]" : "border-[var(--line)] hover:border-[var(--muted)]"
                      }`}
                    />
                    {fieldErrors.name && (
                      <span id="name-error" className="text-xs text-[var(--err)]">
                        {fieldErrors.name}
                      </span>
                    )}
                  </div>

                  <div className="grid gap-1.5">
                    <label htmlFor="email" className="text-sm font-semibold flex justify-between">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: "" }));
                      }}
                      autoComplete="email"
                      inputMode="email"
                      required
                      aria-invalid={!!fieldErrors.email}
                      aria-describedby={fieldErrors.email ? "email-error" : undefined}
                      className={`w-full rounded-[var(--radius)] border bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)] ${
                        fieldErrors.email ? "border-[var(--err)]" : "border-[var(--line)] hover:border-[var(--muted)]"
                      }`}
                    />
                    {fieldErrors.email && (
                      <span id="email-error" className="text-xs text-[var(--err)]">
                        {fieldErrors.email}
                      </span>
                    )}
                  </div>

                  <div className="grid gap-1.5">
                    <label htmlFor="usn" className="text-sm font-semibold flex justify-between">
                      <span>USN</span>
                      <span className="text-xs font-normal text-[var(--muted)]">Optional</span>
                    </label>
                    <input
                      id="usn"
                      type="text"
                      name="usn"
                      value={usn}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase().replace(/\s/g, "");
                        setUsn(val);
                        if (fieldErrors.usn) setFieldErrors((prev) => ({ ...prev, usn: "" }));
                      }}
                      placeholder="1MV22CS001"
                      autoComplete="off"
                      aria-invalid={!!fieldErrors.usn}
                      aria-describedby={fieldErrors.usn ? "usn-error" : undefined}
                      className={`w-full uppercase rounded-[var(--radius)] border bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)] ${
                        fieldErrors.usn ? "border-[var(--err)]" : "border-[var(--line)] hover:border-[var(--muted)]"
                      }`}
                    />
                    {fieldErrors.usn && (
                      <span id="usn-error" className="text-xs text-[var(--err)]">
                        {fieldErrors.usn}
                      </span>
                    )}
                  </div>

                  <div className="grid gap-1.5">
                    <label htmlFor="password" className="text-sm font-semibold flex justify-between">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: "" }));
                        }}
                        autoComplete="new-password"
                        required
                        aria-invalid={!!fieldErrors.password}
                        aria-describedby={fieldErrors.password ? "password-error" : "password-hint"}
                        className={`w-full rounded-[var(--radius)] border bg-[var(--surface)] pl-3 pr-14 py-2 text-sm text-[var(--ink)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)] ${
                          fieldErrors.password ? "border-[var(--err)]" : "border-[var(--line)] hover:border-[var(--muted)]"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-[11px] uppercase tracking-wider text-[var(--muted)] hover:text-[var(--ink)] px-2 py-1"
                      >
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                    {/* Password Strength Meter */}
                    <div className="grid grid-cols-4 gap-1 mt-1" aria-hidden="true">
                      <span
                        className={`h-1 rounded-[2px] transition-colors duration-200 ${
                          score >= 1 ? "bg-[var(--err)]" : "bg-[var(--line)]"
                        }`}
                      />
                      <span
                        className={`h-1 rounded-[2px] transition-colors duration-200 ${
                          score >= 2 ? "bg-[var(--mark)]" : "bg-[var(--line)]"
                        }`}
                      />
                      <span
                        className={`h-1 rounded-[2px] transition-colors duration-200 ${
                          score >= 3 ? "bg-[var(--accent)]" : "bg-[var(--line)]"
                        }`}
                      />
                      <span
                        className={`h-1 rounded-[2px] transition-colors duration-200 ${
                          score >= 4 ? "bg-[var(--ok)]" : "bg-[var(--line)]"
                        }`}
                      />
                    </div>
                    <span id="password-hint" className="text-xs text-[var(--muted)]">
                      At least 8 characters, with letters and a number.
                    </span>
                    {fieldErrors.password && (
                      <span id="password-error" className="text-xs text-[var(--err)]">
                        {fieldErrors.password}
                      </span>
                    )}
                  </div>

                  <div className="grid gap-1.5">
                    <label htmlFor="confirm" className="text-sm font-semibold flex justify-between">
                      Confirm password
                    </label>
                    <input
                      id="confirm"
                      type="password"
                      name="confirm"
                      value={confirm}
                      onChange={(e) => {
                        setConfirm(e.target.value);
                        if (fieldErrors.confirm) setFieldErrors((prev) => ({ ...prev, confirm: "" }));
                      }}
                      autoComplete="new-password"
                      required
                      aria-invalid={!!fieldErrors.confirm}
                      aria-describedby={fieldErrors.confirm ? "confirm-error" : undefined}
                      className={`w-full rounded-[var(--radius)] border bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)] ${
                        fieldErrors.confirm ? "border-[var(--err)]" : "border-[var(--line)] hover:border-[var(--muted)]"
                      }`}
                    />
                    {fieldErrors.confirm && (
                      <span id="confirm-error" className="text-xs text-[var(--err)]">
                        {fieldErrors.confirm}
                      </span>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius)] bg-[var(--accent)] py-2.5 text-sm font-semibold text-[var(--accent-ink)] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_var(--ink)] disabled:opacity-60 disabled:cursor-wait disabled:transform-none disabled:shadow-none"
                  >
                    {submitting ? "Creating your account…" : "Create account"}
                    {!submitting && <ArrowRight className="h-4 w-4" />}
                  </button>
                </form>

                <p className="text-sm text-[var(--muted)]">
                  Already a member?{" "}
                  <Link href="/login" className="font-semibold text-[var(--accent)] hover:underline">
                    Log in
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
