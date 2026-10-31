import Image from "next/image";
import Link from "next/link";
import type { DiraProfile } from "../../data/profile";
import ProfileIdentityMeta from "./ProfileIdentityMeta";

type ProfileHeroProps = {
  profile: DiraProfile;
};

export default function ProfileHero({ profile }: ProfileHeroProps) {
  const featuredLinks = profile.publicPresence.filter((link) => link.featured);
  const featuredExpertise = profile.expertise.filter((item) => item.featured);
  const heroSignals = profile.evidence.slice(0, 4);
  const connectUrl =
    profile.publicPresence.find((link) => link.platform === "LinkedIn")?.url ??
    "#public-presence";

  return (
    <section className="profile-hero">
      <div className="profile-hero-copy hero-enter">
        <p className="eyebrow">PROFESSIONAL IDENTITY</p>

        <h1>{profile.identity.name}</h1>

        <h2>{profile.identity.headline}</h2>

        <ProfileIdentityMeta
          location={profile.identity.location}
          shortSummary={profile.identity.shortSummary}
          biographyPreview={profile.identity.biographyPreview}
        />

        <div className="profile-hero-actions">
          <Link href="#biography" className="profile-text-link">
            Read biography
          </Link>

          <Link href="#public-presence" className="profile-text-link">
            View official presence
          </Link>
        </div>

        <ul className="profile-hero-signals" aria-label="Key credibility signals">
          {heroSignals.map((signal) => (
            <li key={signal.id}>
              <strong>{signal.value}</strong>
              <span>{signal.label}</span>
            </li>
          ))}
        </ul>

        {profile.connection.enabled ? (
          <a
            href={connectUrl}
            className="profile-connection-cta"
            target="_blank"
            rel="noreferrer"
          >
            {profile.connection.label}
          </a>
        ) : null}

        <div className="profile-hero-links" aria-label="Primary public presence links">
          {featuredLinks.map((link) => (
            <a
              key={link.id}
              href={link.url}
              className="profile-primary-link"
              target="_blank"
              rel="noreferrer"
            >
              <span>{link.platform}</span>
              <strong>{link.label}</strong>
            </a>
          ))}
        </div>
      </div>

      <aside className="profile-hero-panel hero-card-enter" aria-label="Profile identity panel">
        <span className="profile-panel-label">DIRAPRO DOSSIER</span>

        <div className="profile-portrait">
          <div className="profile-portrait-orbit profile-portrait-orbit--one" />
          <div className="profile-portrait-orbit profile-portrait-orbit--two" />
          {profile.identity.coverImage ? (
            <Image className="profile-portrait-cover" src={profile.identity.coverImage} alt="" fill sizes="(max-width: 900px) 100vw, 40vw" unoptimized />
          ) : null}
          {profile.identity.image ? (
            <Image className="profile-portrait-photo" src={profile.identity.image} alt={`Portrait of ${profile.identity.name}`} width={172} height={172} unoptimized />
          ) : (
            <div className="profile-portrait-mark">{profile.identity.initials}</div>
          )}
          <span className="profile-portrait-caption">PROFESSIONAL IDENTITY</span>
        </div>

        <div className="profile-panel-body">
          <p className="profile-panel-kicker">Known for</p>

          <ul className="profile-panel-list">
            {featuredExpertise.map((item) => (
              <li key={item.id}>{item.name}</li>
            ))}
          </ul>

          <p className="profile-panel-note">
            Structured around expertise, appointments, contributions, public
            knowledge, and clear digital presence.
          </p>
        </div>
      </aside>
    </section>
  );
}