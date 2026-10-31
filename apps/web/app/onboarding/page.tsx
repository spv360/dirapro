import Link from "next/link";
import { redirect } from "next/navigation";
import Onboarding from "../components/account/Onboarding";
import { profileCompletion } from "../lib/platform/validation";
import { currentProfile } from "../lib/platform/session";

export const metadata = { title: "Build your profile · DiraPro", robots: { index: false } };

export default async function OnboardingPage() {
  const account = await currentProfile();
  if (!account) redirect("/login");

  return (
    <main className="profile-page acct-page">
      <nav className="profile-nav">
        <Link href="/" className="brand">Dira<span>Pro</span></Link>
        <Link href="/dashboard" className="profile-nav-back">Skip to dashboard ↗</Link>
      </nav>
      <Onboarding initial={{ ...account.aggregate, completion: profileCompletion(account.aggregate) }} />
    </main>
  );
}
