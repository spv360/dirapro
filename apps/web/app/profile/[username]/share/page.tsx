import Link from "next/link";
import { notFound } from "next/navigation";
import JourneyStudio from "../../../components/profile/JourneyStudio";
import OwnerSignIn from "../../../components/profile/OwnerSignIn";
import { demoProfile } from "../../../data/profile";
import { listAll } from "../../../lib/journey-store";
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
  if (username !== demoProfile.username) notFound();

  const configured = ownerAuthConfigured();
  const isOwner = configured && (await isProfileOwner(username));

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
        {isOwner ? (
          <JourneyStudio
            username={username}
            initialItems={await listAll(username)}
          />
        ) : (
          <OwnerSignIn configured={configured} />
        )}
      </section>
    </main>
  );
}
