import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import DashboardControls from "../components/account/DashboardControls";
import { listAll } from "../lib/journey-store";
import { currentProfile } from "../lib/platform/session";
import { mediaUrl } from "../lib/platform/to-profile";
import { profileCompletion } from "../lib/platform/validation";
import { SECTION_LINKS } from "./sections";

export const metadata = { title: "Dashboard · DiraPro", robots: { index: false } };

export default async function DashboardPage() {
  const account = await currentProfile();
  if (!account) redirect("/login");

  const agg = account.aggregate;
  const p = agg.profile;
  const completion = profileCompletion(agg);
  const published = p.status === "published";
  const photo = mediaUrl(p.id, p.profileImage);
  const recent = (await listAll(p.id)).slice(0, 3);
  const counts: Record<string, number> = {
    expertise: agg.expertise.length, experience: agg.experience.length, education: agg.education.length,
    recognition: agg.recognition.length, contributions: agg.contributions.length, presence: agg.links.length,
  };

  return (
    <main className="profile-page acct-page">
      <nav className="profile-nav">
        <Link href="/" className="brand">Dira<span>Pro</span></Link>
        <span className="acct-nav-user">{account.user.email}</span>
      </nav>

      <section className="acct-dashboard">
        <header className="acct-identity">
          <div className="acct-avatar">
            {photo ? <Image src={photo} alt="" width={88} height={88} unoptimized /> : <span>{p.fullName.slice(0, 1).toUpperCase()}</span>}
          </div>
          <div>
            <p className="section-eyebrow">YOUR DIRA</p>
            <h1>{p.fullName}</h1>
            <p className="acct-headline">{p.headline || "Add a professional headline"}</p>
            <p className="acct-handle">@{p.username} · <span className={`acct-status acct-status--${p.status}`}>{published ? "Published" : "Draft"}</span></p>
          </div>
        </header>

        <div className="acct-completion">
          <div className="acct-completion__bar" role="progressbar" aria-valuenow={completion.percent} aria-valuemin={0} aria-valuemax={100} aria-label="Profile completion">
            <span style={{ width: `${completion.percent}%` }} />
          </div>
          <p><strong>{completion.percent}% complete</strong>{completion.missing.length ? ` · Next: ${completion.missing.slice(0, 3).join(", ")}` : " · Your profile is complete."}</p>
        </div>

        <DashboardControls username={p.username} published={published} />

        <h2 className="acct-h2">Your profile</h2>
        <ul className="acct-sections">
          {SECTION_LINKS.map((s) => (
            <li key={s.id}>
              <Link href={`/dashboard/profile/${s.id}`}>
                <strong>{s.title}</strong>
                <span>{s.id in counts ? `${counts[s.id]} ${counts[s.id] === 1 ? "entry" : "entries"}` : s.blurb}</span>
              </Link>
            </li>
          ))}
        </ul>
        {p.onboardingStep < 8 ? <p className="acct-hint"><Link href="/onboarding">Continue guided setup →</Link></p> : null}

        <h2 className="acct-h2">Professional Journey</h2>
        <div className="acct-journey">
          {recent.length ? (
            <ul>
              {recent.map((item) => (
                <li key={item.id}><strong>{item.title}</strong><span>{item.status} · {item.type}</span></li>
              ))}
            </ul>
          ) : (
            <p>Share what you&apos;re working on to build a living record of your work.</p>
          )}
          <Link href={`/profile/${p.username}/share`} className="button button-primary">Share what you&apos;re working on</Link>
        </div>
      </section>
    </main>
  );
}
