import type { PublicPresenceLink } from "../../data/profile";

type PresenceLinkGroupProps = {
  title: string;
  description: string;
  links: PublicPresenceLink[];
};

function PlatformMark({ platform }: { platform: string }) {
  const normalizedPlatform = platform.toLowerCase();

  if (normalizedPlatform === "linkedin") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true" className="presence-link-mark">
        <rect width="32" height="32" rx="5" fill="currentColor" />
        <circle cx="9" cy="9" r="2" fill="var(--surface)" />
        <path d="M7.5 13h3v11h-3zm5 0h2.9v1.5c.8-1.1 1.9-1.9 3.7-1.9 3.5 0 4.4 2.3 4.4 5.3V24h-3v-5.5c0-1.3 0-3-1.9-3s-2.2 1.4-2.2 2.9V24h-3z" fill="var(--surface)" />
      </svg>
    );
  }

  if (normalizedPlatform === "x") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true" className="presence-link-mark">
        <path d="M7 6h5.8l5.1 6.8L23.5 6H26l-6.9 8.3L26 26h-5.8l-5.5-7.4L8.5 26H6l7.1-8.8z" fill="currentColor" />
      </svg>
    );
  }

  if (normalizedPlatform === "instagram") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true" className="presence-link-mark">
        <rect x="4" y="4" width="24" height="24" rx="7" fill="none" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="16" cy="16" r="5.2" fill="none" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="23" cy="9" r="1.5" fill="currentColor" />
      </svg>
    );
  }

  if (normalizedPlatform === "facebook") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true" className="presence-link-mark">
        <circle cx="16" cy="16" r="14" fill="currentColor" />
        <path d="M18.2 25v-7h2.8l.4-3.2h-3.2v-2c0-.9.3-1.5 1.6-1.5h1.7V8.4c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.2H12V18h2.8v7z" fill="var(--surface)" />
      </svg>
    );
  }

  if (normalizedPlatform === "youtube") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true" className="presence-link-mark">
        <rect x="3" y="7" width="26" height="18" rx="5" fill="currentColor" />
        <path d="m13 11.5 8 4.5-8 4.5z" fill="var(--surface)" />
      </svg>
    );
  }

  return <span className="presence-link-mark presence-link-mark--fallback" aria-hidden="true">↗</span>;
}

export default function PresenceLinkGroup({
  title,
  description,
  links,
}: PresenceLinkGroupProps) {
  const headingId = `presence-${title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")}`;

  return (
    <section className="presence-group" aria-labelledby={headingId}>
      <div className="presence-group__intro">
        <h3 id={headingId}>{title}</h3>
        <p>{description}</p>
      </div>

      <div className="presence-group__list">
        {links.map((link) => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noreferrer"
            className="presence-link-card"
          >
            <div className="presence-link-card__identity">
              <PlatformMark platform={link.platform} />
              <div>
                <span className="presence-link-platform">{link.platform}</span>
                <strong>{link.label}</strong>
                {link.descriptor ? <p>{link.descriptor}</p> : null}
              </div>
            </div>

            <div className="presence-link-meta">
              <span>↗</span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}