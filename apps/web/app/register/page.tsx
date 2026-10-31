import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "../components/account/AuthForms";
import { ACCOUNTS_DISABLED_MESSAGE, accountsDisabled, currentUser } from "../lib/platform/session";

export const metadata = { title: "Create your profile · DiraPro", robots: { index: false } };

export default async function RegisterPage() {
  if (await currentUser()) redirect("/dashboard");
  const disabled = accountsDisabled();

  return (
    <main className="profile-page acct-page">
      <nav className="profile-nav">
        <Link href="/" className="brand">Dira<span>Pro</span></Link>
        <Link href="/login" className="profile-nav-back">Sign in ↗</Link>
      </nav>
      <section className="acct-card">
        <p className="section-eyebrow">CREATE YOUR PROFILE</p>
        <h1>Your professional identity, in your own words.</h1>
        {disabled ? (
          <div className="journey-notice" role="status"><p>{ACCOUNTS_DISABLED_MESSAGE}</p></div>
        ) : (
          <RegisterForm />
        )}
      </section>
    </main>
  );
}
