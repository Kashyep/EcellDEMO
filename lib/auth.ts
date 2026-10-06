import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { SignupData, SignupErrors, User } from "./types";

const FLASH_KEY = "ecell.flash";

// ---------- validation (same rules as profiles table) ----------
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const USN_RE = /^[1-4][A-Z]{2}\d{2}[A-Z]{2,3}\d{3}$/;

export function validateSignup({ name, email, usn, password }: SignupData): SignupErrors {
  const errors: SignupErrors = {};
  if (!name || name.trim().length < 2) errors.name = "Enter your full name.";
  else if (name.trim().length > 80) errors.name = "Keep your name under 80 characters.";
  if (!EMAIL_RE.test(email || "")) errors.email = "Enter a valid email address, like you@example.com.";
  if (usn && !USN_RE.test(usn.trim().toUpperCase())) errors.usn = "USN looks like 1MV22CS001. Leave it blank if you don't have one.";
  if (!password || password.length < 8) errors.password = "Use at least 8 characters.";
  else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) errors.password = "Mix letters and at least one number.";
  return errors;
}

export function passwordScore(pw: string): number {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
  return Math.max(1, Math.min(4, s));
}

export interface FriendlyError extends Error {
  fields?: Record<string, string>;
  code?: string;
  status?: number;
}

// Turn Supabase errors into messages a member can act on.
export function friendly(error: any): FriendlyError {
  const code = error && (error.code || "");
  const status = error && error.status;
  if (code === "invalid_credentials") return new Error("Email or password is incorrect.");
  if (code === "email_not_confirmed") return new Error("Confirm your email first. Open the link we sent to your inbox, then log in.");
  if (code === "user_already_exists" || code === "email_exists") {
    const e: FriendlyError = new Error("An account with this email already exists. Log in instead.");
    e.fields = { email: "Already registered." };
    return e;
  }
  if (code === "weak_password") return Object.assign(new Error("Choose a stronger password."), { fields: { password: error.message } });
  if (status === 429 || code === "over_request_rate_limit" || code === "over_email_send_rate_limit") {
    return new Error("Too many attempts right now. Wait a minute and try again.");
  }
  if (error && error.name === "AuthRetryableFetchError") return new Error("We couldn't reach the sign-in service. Check your connection and try again.");
  return new Error((error && error.message) || "Something went wrong. Try again.");
}

export function toUser(authUser: any, profile: any): User {
  const meta = authUser.user_metadata || {};
  return {
    id: authUser.id,
    name: (profile && profile.full_name) || meta.full_name || (authUser.email ? authUser.email.split("@")[0] : "Member"),
    email: authUser.email || "",
    usn: (profile && profile.usn) || "",
    memberId: (profile && profile.member_id) || "Pending",
    createdAt: (profile && profile.created_at) || authUser.created_at,
    checklist: (profile && profile.checklist) || {},
    domain: (profile && profile.domain) || null,
    designation: (profile && profile.designation) || null,
  };
}

let client: SupabaseClient | null = null;

export function sb(): SupabaseClient {
  if (client) return client;

  const url = (
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "https://kovebqhqibixpdlwgqlr.supabase.co"
  ).trim().replace(/\/+$/, "");

  const key = (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    "sb_publishable_WWM_JYb8fra9QPoLiUSBjg_xpI75EM-"
  ).trim();

  if (!url || !key) {
    throw new Error("Sign-in isn't set up on this copy of the site yet. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  if (key.startsWith("sb_secret_")) {
    throw new Error("SUPABASE_ANON_KEY is a secret key (sb_secret_...). Use the public anon/publishable key instead.");
  }

  if (key.split(".").length === 3) {
    try {
      const b64 = key.split(".")[1];
      const decoded = typeof atob === "function" ? atob(b64) : Buffer.from(b64, "base64").toString("utf8");
      const payload = JSON.parse(decoded);
      if (payload && payload.role === "service_role") {
        throw new Error("SUPABASE_ANON_KEY is a service_role key. Never expose service_role in the browser! Use the 'anon' public key.");
      }
    } catch (e: any) {
      if (e.message && e.message.includes("service_role")) throw e;
    }
  }

  client = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return client;
}

export const clientFn = sb;

export async function signup({ name, email, usn, password }: SignupData): Promise<{ user: User; needsConfirmation: boolean }> {
  let emailRedirectTo = "/dashboard";
  if (typeof window !== "undefined" && window.location) {
    emailRedirectTo = new URL("/dashboard", window.location.origin).href;
  }

  const { data, error } = await sb().auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: {
        full_name: name.trim(),
        usn: (usn || "").trim().toUpperCase(),
      },
      emailRedirectTo,
    },
  });

  if (error) throw friendly(error);

  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    throw friendly({ code: "user_already_exists" });
  }

  return {
    user: toUser(data.user, null),
    needsConfirmation: !data.session,
  };
}

export async function login({ email, password }: { email: string; password: string }): Promise<{ user: User }> {
  const { data, error } = await sb().auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) throw friendly(error);
  return { user: toUser(data.user, null) };
}

export async function me(): Promise<{ user: User } | null> {
  const { data, error } = await sb().auth.getSession();
  if (error) throw friendly(error);
  if (!data.session) return null;

  const authUser = data.session.user;
  const { data: profile, error: pErr } = await sb()
    .from("profiles")
    .select("full_name, usn, member_id, checklist, created_at, domain, designation")
    .eq("id", authUser.id)
    .maybeSingle();

  if (pErr) throw friendly(pErr);
  return { user: toUser(authUser, profile) };
}

export async function saveChecklist(userId: string, checklist: Record<string, boolean>): Promise<void> {
  const { error } = await sb().from("profiles").update({ checklist }).eq("id", userId);
  if (error) throw friendly(error);
}

export async function logout(): Promise<void> {
  const { error } = await sb().auth.signOut();
  if (error) throw friendly(error);
}

export function flash(msg: string): void {
  try {
    if (typeof window !== "undefined" && window.sessionStorage) {
      sessionStorage.setItem(FLASH_KEY, msg);
    }
  } catch (_) {}
}

export function takeFlash(): string | null {
  try {
    if (typeof window !== "undefined" && window.sessionStorage) {
      const m = sessionStorage.getItem(FLASH_KEY);
      sessionStorage.removeItem(FLASH_KEY);
      return m;
    }
  } catch (_) {}
  return null;
}

export const Auth = {
  validateSignup,
  passwordScore,
  signup,
  login,
  me,
  logout,
  saveChecklist,
  client: sb,
  sb,
  friendly,
  flash,
  takeFlash,
  toUser,
};

export default Auth;
