"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { postJson } from "./api";

type Errors = Record<string, string>;

function PasswordInput({ id, value, onChange, autoComplete, error, describedBy }: {
  id: string; value: string; onChange: (v: string) => void; autoComplete: string; error?: string; describedBy?: string;
}) {
  const [shown, setShown] = useState(false);
  return (
    <div className="acct-password">
      <input
        id={id}
        name={id}
        type={shown ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        required
      />
      <button type="button" className="acct-toggle" onClick={() => setShown((s) => !s)} aria-pressed={shown}>
        {shown ? "Hide" : "Show"}
      </button>
    </div>
  );
}

const slug = (value: string) =>
  value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 30);

export function RegisterForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [usernameEdited, setUsernameEdited] = useState(false);
  const [password, setPassword] = useState("");
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [availability, setAvailability] = useState<{ available: boolean; reason: string | null } | null>(null);

  useEffect(() => {
    if (username.length < 3) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/auth/username?u=${encodeURIComponent(username)}`, { signal: controller.signal });
        if (response.ok) setAvailability(await response.json());
      } catch {
        /* aborted or offline: server validates on submit */
      }
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [username]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setErrors({});
    setFormError("");
    const result = await postJson<unknown>("/api/auth/register", "POST", { fullName, email, username, password, terms });
    if (result.ok) {
      router.push("/onboarding");
      router.refresh();
      return;
    }
    setBusy(false);
    setErrors(result.errors);
    if (!Object.keys(result.errors).length) setFormError(result.message);
  }

  return (
    <form className="acct-form" onSubmit={submit} noValidate>
      <div className="journey-field">
        <label htmlFor="fullName">Full name</label>
        <input
          id="fullName" name="fullName" value={fullName} autoComplete="name" required
          onChange={(e) => {
            setFullName(e.target.value);
            if (!usernameEdited) setUsername(slug(e.target.value));
          }}
          aria-invalid={Boolean(errors.fullName)}
        />
        {errors.fullName ? <p className="journey-error">{errors.fullName}</p> : null}
      </div>

      <div className="journey-field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" value={email} autoComplete="email" required
          onChange={(e) => setEmail(e.target.value)} aria-invalid={Boolean(errors.email)} />
        {errors.email ? <p className="journey-error">{errors.email}</p> : null}
      </div>

      <div className="journey-field">
        <label htmlFor="username">Profile address</label>
        <div className="acct-username">
          <span aria-hidden="true">dira.world/profile/</span>
          <input id="username" name="username" value={username} autoComplete="username" required
            onChange={(e) => { setUsernameEdited(true); setUsername(e.target.value.toLowerCase()); }}
            aria-invalid={Boolean(errors.username)} aria-describedby="username-status" />
        </div>
        <p id="username-status" className={errors.username || (availability && username.length >= 3 && !availability.available) ? "journey-error" : "acct-hint"} aria-live="polite">
          {errors.username ?? (availability && username.length >= 3 ? (availability.available ? "✓ Available" : availability.reason) : "Lowercase letters, numbers and hyphens.")}
        </p>
      </div>

      <div className="journey-field">
        <label htmlFor="password">Password</label>
        <PasswordInput id="password" value={password} onChange={setPassword} autoComplete="new-password" error={errors.password} describedBy="password-hint" />
        <p id="password-hint" className={errors.password ? "journey-error" : "acct-hint"}>
          {errors.password ?? "At least 10 characters, with a letter and a number."}
        </p>
      </div>

      <label className="journey-check">
        <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
        <span>I agree to the Terms and Privacy Policy.</span>
      </label>
      {errors.terms ? <p className="journey-error">{errors.terms}</p> : null}
      {formError ? <p className="journey-error" role="alert">{formError}</p> : null}

      <button type="submit" className="button button-primary" disabled={busy}>
        {busy ? "Creating your account…" : "Create account"}
      </button>
      <p className="acct-alt">Already have an account? <Link href="/login">Sign in</Link></p>
    </form>
  );
}

export function LoginForm() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const result = await postJson<unknown>("/api/auth/login", "POST", { identifier, password });
    if (result.ok) {
      router.push("/dashboard");
      router.refresh();
      return;
    }
    setBusy(false);
    setError(result.message);
  }

  return (
    <form className="acct-form" onSubmit={submit}>
      <div className="journey-field">
        <label htmlFor="identifier">Email or username</label>
        <input id="identifier" name="identifier" value={identifier} autoComplete="username" required onChange={(e) => setIdentifier(e.target.value)} />
      </div>
      <div className="journey-field">
        <label htmlFor="password">Password</label>
        <PasswordInput id="password" value={password} onChange={setPassword} autoComplete="current-password" />
      </div>
      {error ? <p className="journey-error" role="alert">{error}</p> : null}
      <button type="submit" className="button button-primary" disabled={busy}>
        {busy ? "Signing in…" : "Sign in"}
      </button>
      <p className="acct-alt">New to Dira? <Link href="/register">Create your profile</Link></p>
    </form>
  );
}
