import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PublicProfileView from "../../components/profile/PublicProfileView";
import { demoProfile } from "../../data/profile";
import { withJourneyMoments } from "../../lib/current-moment";
import { listPublic } from "../../lib/journey-store";
import { isProfileOwner } from "../../lib/owner-auth";
import { profiles } from "../../lib/platform";
import { currentUser } from "../../lib/platform/session";
import { toDiraProfile } from "../../lib/platform/to-profile";

type ProfilePageProps = {
  params: Promise<{
    username: string;
  }>;
};

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  if (username === demoProfile.username) return {};
  const agg = await profiles.getByUsernameForViewer(username, null);
  if (!agg) return { robots: { index: false } };
  return { title: `${agg.profile.fullName} · DiraPro`, description: agg.profile.headline || undefined };
}

export default async function ProfilePage({
  params,
}: ProfilePageProps) {
  const { username } = await params;

  if (username === demoProfile.username) {
    const journeyItems = await listPublic(demoProfile.username);
    return (
      <main>
        <PublicProfileView
          profile={demoProfile}
          journeyItems={journeyItems}
          isOwner={await isProfileOwner(demoProfile.username)}
          manageHref={`/profile/${demoProfile.username}/share`}
          currentMoment={withJourneyMoments(demoProfile.currentMoment, journeyItems)}
        />
      </main>
    );
  }

  const viewer = await currentUser();
  // Drafts resolve only for their owner; everyone else gets a 404.
  const agg = await profiles.getByUsernameForViewer(username, viewer?.id ?? null);
  if (!agg) notFound();

  const profile = toDiraProfile(agg);
  const isOwner = viewer?.id === agg.profile.ownerId;
  const journeyItems = await listPublic(agg.profile.id);
  const isDraft = agg.profile.status !== "published";

  return (
    <main>
      {isDraft ? (
        <p className="acct-draft-banner" role="status">
          This profile is a draft and visible only to you. <a href="/dashboard">Back to dashboard</a>
        </p>
      ) : null}
      <PublicProfileView
        profile={profile}
        journeyItems={journeyItems}
        isOwner={isOwner}
        manageHref={isOwner ? `/profile/${username}/share` : "/login"}
        currentMoment={withJourneyMoments(profile.currentMoment, journeyItems)}
      />
    </main>
  );
}
