import Link from "next/link";
import { notFound } from "next/navigation";
import AchievementsSection from "../../components/profile/AchievementsSection";
import ContributionsSection from "../../components/profile/ContributionsSection";
import EvidenceSection from "../../components/profile/EvidenceSection";
import ExperienceSection from "../../components/profile/ExperienceSection";
import ExpertiseSection from "../../components/profile/ExpertiseSection";
import ProfileHero from "../../components/profile/ProfileHero";
import PublicPresenceSection from "../../components/profile/PublicPresenceSection";
import Reveal from "../../components/Reveal";
import { demoProfile } from "../../data/profile";
import CurrentMomentSection from "../../components/profile/CurrentMomentSection";
import ProfileClosingSection from "../../components/profile/ProfileClosingSection";
import PublicMomentsSection from "../../components/profile/PublicMomentsSection";

type ProfilePageProps = {
  params: Promise<{
    username: string;
  }>;
};

export default async function ProfilePage({
  params,
}: ProfilePageProps) {
  const { username } = await params;

  if (username !== demoProfile.username) {
    notFound();
  }

  const profile = demoProfile;

  return (
    <main className="profile-page">
      <nav className="profile-nav">
        <Link href="/" className="brand">
          Dira<span>Pro</span>
        </Link>

        <Link href="/" className="profile-nav-back">
          Back to DiraPro ↗
        </Link>
      </nav>

      <ProfileHero profile={profile} />

      <div className="profile-story-grid">
        <Reveal>
          <ExpertiseSection items={profile.expertise} />
        </Reveal>

        <Reveal>
          <CurrentMomentSection
            moment={profile.currentMoment}
          />
        </Reveal>
      </div>

      <Reveal>
        <ExperienceSection
          biography={profile.identity.biography}
          appointments={profile.appointments}
        />
      </Reveal>

      <Reveal>
        <AchievementsSection items={profile.achievements} />
      </Reveal>

      <Reveal>
        <ContributionsSection items={profile.contributions} />
      </Reveal>

      <Reveal>
        <PublicMomentsSection
          items={profile.publicMoments}
          knowledge={profile.knowledge}
          media={profile.media}
        />
      </Reveal>

      <Reveal>
        <PublicPresenceSection links={profile.publicPresence} />
      </Reveal>

      <Reveal>
        <EvidenceSection items={profile.evidence} />
      </Reveal>

      <ProfileClosingSection profile={profile} />

      <footer className="profile-footer">
        <span>© {new Date().getFullYear()} DiraPro</span>

        <Link href="/">Build your Dira identity ↗</Link>
      </footer>
    </main>
  );
}