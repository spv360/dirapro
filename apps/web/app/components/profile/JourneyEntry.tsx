import Image from "next/image";
import { formatJourneyDate } from "../../data/journey";

export type JourneyDisplay = {
  type: string;
  title: string;
  description: string;
  date: string;
  organization: string;
  tags: string[];
  externalUrl: string;
  media: { kind: "image" | "video"; src: string; alt?: string } | null;
};

type JourneyEntryProps = {
  item: JourneyDisplay;
  variant?: "featured" | "entry";
};

export function JourneyMediaView({
  media,
  title,
  sizes,
}: {
  media: NonNullable<JourneyDisplay["media"]>;
  title: string;
  sizes: string;
}) {
  if (media.kind === "video") {
    return (
      <video
        className="journey-entry__video"
        src={media.src}
        controls
        playsInline
        preload="metadata"
        aria-label={media.alt || `${title} video`}
      />
    );
  }

  return (
    <Image
      src={media.src}
      alt={media.alt || title}
      fill
      sizes={sizes}
      unoptimized
      className="journey-entry__image"
    />
  );
}

export default function JourneyEntry({ item, variant = "entry" }: JourneyEntryProps) {
  const featured = variant === "featured";

  return (
    <article className={`journey-entry journey-entry--${variant}`}>
      {item.media ? (
        <div className="journey-entry__media">
          <JourneyMediaView
            media={item.media}
            title={item.title}
            sizes={featured ? "(max-width: 900px) 100vw, 55vw" : "(max-width: 900px) 100vw, 320px"}
          />
        </div>
      ) : null}

      <div className="journey-entry__body">
        <div className="journey-entry__meta">
          <span className="journey-entry__type">{item.type}</span>
          {item.organization ? <span>{item.organization}</span> : null}
          <time dateTime={item.date}>{formatJourneyDate(item.date)}</time>
        </div>

        {featured ? <h3>{item.title}</h3> : <h4>{item.title}</h4>}
        {item.description ? <p>{item.description}</p> : null}

        {item.tags.length ? (
          <ul className="journey-entry__tags" aria-label="Topics">
            {item.tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        ) : null}

        {item.externalUrl ? (
          <a href={item.externalUrl} target="_blank" rel="noopener noreferrer" className="public-moment-card__link">
            Explore ↗
          </a>
        ) : null}
      </div>
    </article>
  );
}
