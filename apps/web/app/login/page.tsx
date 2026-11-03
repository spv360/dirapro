import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "../components/account/AuthForms";
import { ACCOUNTS_DISABLED_MESSAGE, accountsDisabled, currentUser } from "../lib/platform/session";
import { platformBackend } from "../lib/platform";

export const metadata = { title: "Sign in · DiraPro", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ verification?: string }> }) {
  if (await currentUser()) redirect("/dashboard");
  const disabled = accountsDisabled();
  const { verification } = await searchParams;
  const notice =
    verification === "verified" ? "Email verified. You can now sign in." :
    verification === "failed" ? "This verification link is invalid or has expired. Sign in if you have already verified your email, or request a new link." :
    verification === "unavailable" ? ACCOUNTS_DISABLED_MESSAGE : undefined;

  return (
    <main className="profile-page acct-page">
      <nav className="profile-nav">
        <Link href="/" className="brand">Dira<span>Pro</span></Link>
        <Link href="/register" className="profile-nav-back">Create profile ↗</Link>
      </nav>
      <section className="acct-card">
        <p className="section-eyebrow">WELCOME BACK</p>
        <h1>Sign in to manage your profile.</h1>
        {disabled ? (
          <div className="journey-notice" role="status"><p>{ACCOUNTS_DISABLED_MESSAGE}</p></div>
        ) : (
          <LoginForm emailOnly={platformBackend === "supabase"} notice={notice} />
        )}
      </section>
    </main>
  );
}
