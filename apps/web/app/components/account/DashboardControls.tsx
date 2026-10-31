"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { postJson } from "./api";

type Props = { username: string; published: boolean };

export default function DashboardControls({ username, published }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function setPublished(next: boolean) {
    setBusy(true);
    setError("");
    const result = await postJson<unknown>("/api/profile/publish", "POST", { published: next });
    setBusy(false);
    if (!result.ok) return setError(result.message);
    router.refresh();
  }

  async function copy() {
    const url = `${window.location.origin}/profile/${username}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy. Select the address above instead.");
    }
  }

  return (
    <div className="acct-controls">
      <Link href={`/profile/${username}`} className="button button-secondary">{published ? "View public profile" : "Preview profile"}</Link>
      <button type="button" className="button button-primary" onClick={() => setPublished(!published)} disabled={busy}>
        {busy ? "Working…" : published ? "Unpublish" : "Publish profile"}
      </button>
      <button type="button" className="button button-secondary" onClick={copy}>{copied ? "Copied ✓" : "Copy profile link"}</button>
      <form method="post" action="/logout">
        <button type="submit" className="journey-link-button">Sign out</button>
      </form>
      {error ? <p className="journey-error" role="alert">{error}</p> : null}
    </div>
  );
}
