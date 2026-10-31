import Link from "next/link";
import type { JourneyItem } from "../../data/journey";
import type { DiraProfile } from "../../data/profile";
import Reveal from "../Reveal";
import AchievementsSection from "./AchievementsSection";
import ContributionsSection from "./ContributionsSection";
import CurrentMomentSection from "./CurrentMomentSection";
import EducationSection from "./EducationSection";
import EvidenceSection from "./EvidenceSection";
import ExperienceSection from "./ExperienceSection";
import ExpertiseSection from "./ExpertiseSection";
import ProfessionalJourney from "./ProfessionalJourney";
import ProfileClosingSection from "./ProfileClosingSection";
import ProfileHero from "./ProfileHero";
import PublicMomentsSection from "./PublicMomentsSection";
import PublicPresenceSection from "./PublicPresenceSection";

type PublicProfileViewProps = {
  profile: DiraProfile;
  journeyItems: JourneyItem[];
  isOwner: boolean;
  /** Where the owner manages updates; unauthenticated visitors get a sign-in link. */
  manageHref: string;
  /** Preview mode hides Journey (it is not part of the draft being edited). */
  hideJourney?: boolean;
  currentMoment: DiraProfile["currentMoment"];
};

/** Presentational profile. Sections with no data are omitted so new profiles never render empty shells. */
export default function PublicProfileView({
  profile,
  journeyItems,
  isOwner,
  manageHref,
  hideJourney = false,
  currentMoment,
}: PublicProfileViewProps) {
  const hasMoments = currentMoment.moments.length > 0;
  const hasWorld = profile.publicMoments.length + profile.knowledge.length + profile.media.length > 0;

  return (
    <div className="profile-page">
      <nav className="profile-nav">
        <Link href="/" className="brand">
          Dira<span>Pro</span>
        </Link>

        <Link href="/" className="profile-nav-back">
          Back to DiraPro ↗
        </Link>
      </nav>

      <ProfileHero profile={profile} />

      {hasMoments ? (
        <div className="profile-story-grid">
          <Reveal>
            <ExpertiseSection items={profile.expertise} />
          </Reveal>

          <Reveal>
            <CurrentMomentSection moment={currentMoment} />
          </Reveal>
        </div>
      ) : profile.expertise.length > 0 ? (
        <Reveal>
          <ExpertiseSection items={profile.expertise} />
        </Reveal>
      ) : null}

      {hideJourney ? null : (
        <Reveal>
          <ProfessionalJourney items={journeyItems} username={profile.username} isOwner={isOwner} />
        </Reveal>
      )}

      {profile.appointments.length > 0 || profile.identity.biography ? (
        <Reveal>
          <ExperienceSection biography={profile.identity.biography} appointments={profile.appointments} />
        </Reveal>
      ) : null}

      {profile.education && profile.education.length > 0 ? (
        <Reveal>
          <EducationSection items={profile.education} />
        </Reveal>
      ) : null}

      {profile.achievements.length > 0 ? (
        <Reveal>
          <AchievementsSection items={profile.achievements} />
        </Reveal>
      ) : null}

      {profile.contributions.length > 0 ? (
        <Reveal>
          <ContributionsSection items={profile.contributions} />
        </Reveal>
      ) : null}

      {hasWorld ? (
        <Reveal>
          <PublicMomentsSection items={profile.publicMoments} knowledge={profile.knowledge} media={profile.media} />
        </Reveal>
      ) : null}

      {profile.publicPresence.length > 0 ? (
        <Reveal>
          <PublicPresenceSection links={profile.publicPresence} name={profile.identity.name} />
        </Reveal>
      ) : null}

      {profile.evidence.length > 0 ? (
        <Reveal>
          <EvidenceSection items={profile.evidence} />
        </Reveal>
      ) : null}

      <ProfileClosingSection profile={profile} />

      <footer className="profile-footer">
        <span>© {new Date().getFullYear()} DiraPro</span>

        <Link href={manageHref}>{isOwner ? "Manage updates" : "Owner sign in"}</Link>

        <Link href="/">Build your Dira identity ↗</Link>
      </footer>
    </div>
  );
}
