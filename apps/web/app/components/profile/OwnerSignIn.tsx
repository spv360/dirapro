"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function OwnerSignIn({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!configured) {
    return (
      <div className="journey-signin">
        <p className="section-eyebrow">OWNER ACCESS</p>
        <h1>Publishing isn&apos;t configured.</h1>
        <p>
          Set <code>DIRA_OWNER_PASSCODE</code> (8+ characters) and{" "}
          <code>DIRA_SESSION_SECRET</code> (16+ characters) on the server to enable
          owner publishing.
        </p>
      </div>
    );
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/owner/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      if (!response.ok) {
        setError(((await response.json().catch(() => null)) as { error?: string } | null)?.error ?? "Could not sign in.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="journey-signin" onSubmit={submit}>
      <p className="section-eyebrow">OWNER ACCESS</p>
      <h1>Sign in to share.</h1>
      <p>Only the profile owner can publish updates.</p>
      <label className="journey-field">
        <span>Owner passcode</span>
        <input
          type="password"
          value={passcode}
          onChange={(event) => setPasscode(event.target.value)}
          autoComplete="current-password"
          required
        />
      </label>
      {error ? <p className="journey-error" role="alert">{error}</p> : null}
      <button className="button button-primary" type="submit" disabled={busy}>
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
