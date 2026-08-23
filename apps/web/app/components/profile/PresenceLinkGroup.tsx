import type { PublicPresenceLink } from "../../data/profile";

type PresenceLinkGroupProps = {
  title: string;
  description: string;
  links: PublicPresenceLink[];
};

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
            <div>
              <span className="presence-link-platform">{link.platform}</span>
              <strong>{link.label}</strong>
              {link.descriptor ? <p>{link.descriptor}</p> : null}
            </div>

            <div className="presence-link-meta">
              {link.sourceType ? <span>{link.sourceType}</span> : null}
              <span>↗</span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}