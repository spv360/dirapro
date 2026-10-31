import Link from "next/link";
import { mediaUrl, type JourneyItem } from "../../data/journey";
import JourneyEntry, { type JourneyDisplay } from "./JourneyEntry";

export function toDisplay(item: JourneyItem): JourneyDisplay {
  return {
    type: item.type,
    title: item.title,
    description: item.description,
    date: item.date,
    organization: item.organization,
    tags: item.tags,
    externalUrl: item.externalUrl,
    media: item.media
      ? { kind: item.media.kind, src: mediaUrl(item.media), alt: item.media.alt }
      : null,
  };
}

type ProfessionalJourneyProps = {
  items: JourneyItem[];
  username: string;
  isOwner: boolean;
};

export default function ProfessionalJourney({ items, username, isOwner }: ProfessionalJourneyProps) {
  // Public visitors see nothing until something is published.
  if (!items.length && !isOwner) return null;

  const featured = items.find((item) => item.featured) ?? null;
  const chronological = items.filter((item) => item.id !== featured?.id);

  return (
    <section className="profile-section profile-journey" id="journey">
      <div className="profile-journey__heading">
        <div>
          <p className="section-eyebrow">PROFESSIONAL JOURNEY</p>
          <h2>What I&apos;m working on.</h2>
        </div>

        <div className="profile-journey__aside">
          <p>Updates published directly by this professional, in their own words.</p>
          {isOwner ? (
            <Link href={`/profile/${username}/share`} className="button button-primary">
              Share what you&apos;re working on
            </Link>
          ) : null}
        </div>
      </div>

      {!items.length ? (
        <p className="profile-journey__empty">
          Nothing published yet. Your first update will appear here.
        </p>
      ) : null}

      {featured ? <JourneyEntry item={toDisplay(featured)} variant="featured" /> : null}

      {chronological.length ? (
        <div className="profile-journey__list">
          {chronological.map((item) => (
            <JourneyEntry key={item.id} item={toDisplay(item)} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
