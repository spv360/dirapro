import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import JourneyStudio from "../../../components/profile/JourneyStudio";
import OwnerSignIn from "../../../components/profile/OwnerSignIn";
import { demoProfile } from "../../../data/profile";
import { listAll } from "../../../lib/journey-store";
import { profiles } from "../../../lib/platform";
import { currentUser } from "../../../lib/platform/session";
import { PUBLISHING_DISABLED_MESSAGE, publishingDisabled } from "../../../lib/publishing";
import { isProfileOwner, ownerAuthConfigured } from "../../../lib/owner-auth";

export const metadata = {
  title: "Share what you're working on · DiraPro",
  robots: { index: false },
};

type SharePageProps = {
  params: Promise<{ username: string }>;
};

export default async function SharePage({ params }: SharePageProps) {
  const { username } = await params;
  const isDemo = username === demoProfile.username;

  const disabled = publishingDisabled();
  const configured = ownerAuthConfigured();
  let isOwner = false;
  let journeyProfileId = username;

  if (isDemo) {
    isOwner = !disabled && configured && (await isProfileOwner(username));
  } else {
    const agg = await profiles.getByUsernameForViewer(username, (await currentUser())?.id ?? null);
    if (!agg) notFound();
    isOwner = !disabled && agg.profile.ownerId === (await currentUser())?.id;
    journeyProfileId = agg.profile.id;
    if (!disabled && !isOwner) redirect("/login");
  }

  return (
    <main className="profile-page">
      <nav className="profile-nav">
        <Link href="/" className="brand">
          Dira<span>Pro</span>
        </Link>
        <Link href={`/profile/${username}`} className="profile-nav-back">
          View profile ↗
        </Link>
      </nav>

      <section className="profile-section journey-studio-page">
        {disabled ? (
          <div className="journey-signin">
            <p className="section-eyebrow">PROFESSIONAL JOURNEY</p>
            <h1>Publishing is temporarily unavailable.</h1>
            <p>{PUBLISHING_DISABLED_MESSAGE}</p>
            <Link href={`/profile/${username}`} className="button button-secondary">
              Back to profile
            </Link>
          </div>
        ) : isOwner ? (
          <JourneyStudio
            username={username}
            initialItems={await listAll(journeyProfileId)}
          />
        ) : (
          <OwnerSignIn configured={configured} />
        )}
      </section>
    </main>
  );
}
