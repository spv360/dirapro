import Link from "next/link";
import { notFound } from "next/navigation";
import AchievementsSection from "../../components/profile/AchievementsSection";
import ContributionsSection from "../../components/profile/ContributionsSection";
import EvidenceSection from "../../components/profile/EvidenceSection";
import ExperienceSection from "../../components/profile/ExperienceSection";
import ExpertiseSection from "../../components/profile/ExpertiseSection";
import KnowledgeSection from "../../components/profile/KnowledgeSection";
import MediaSection from "../../components/profile/MediaSection";
import ProfileHero from "../../components/profile/ProfileHero";
import PublicPresenceSection from "../../components/profile/PublicPresenceSection";
import Reveal from "../../components/Reveal";
import { demoProfile } from "../../data/profile";

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

      <Reveal>
        <ExpertiseSection items={profile.expertise} />
      </Reveal>

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
        <KnowledgeSection items={profile.knowledge} />
      </Reveal>

      <Reveal>
        <MediaSection items={profile.media} />
      </Reveal>

      <Reveal>
        <PublicPresenceSection links={profile.publicPresence} />
      </Reveal>

      <Reveal>
        <EvidenceSection items={profile.evidence} />
      </Reveal>

      <footer className="profile-footer">
        <span>© {new Date().getFullYear()} DiraPro</span>

        <Link href="/">Build your Dira identity ↗</Link>
      </footer>
    </main>
  );
}