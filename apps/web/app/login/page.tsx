import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "../components/account/AuthForms";
import { ACCOUNTS_DISABLED_MESSAGE, accountsDisabled, currentUser } from "../lib/platform/session";

export const metadata = { title: "Sign in · DiraPro", robots: { index: false } };

export default async function LoginPage() {
  if (await currentUser()) redirect("/dashboard");
  const disabled = accountsDisabled();

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
          <LoginForm />
        )}
      </section>
    </main>
  );
}
