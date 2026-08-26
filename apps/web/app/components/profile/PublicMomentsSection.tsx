import Image from "next/image";
import type { KnowledgeItem, MediaItem, PublicMoment } from "../../data/profile";

type PublicMomentsSectionProps = {
  items: PublicMoment[];
  knowledge: KnowledgeItem[];
  media: MediaItem[];
};

type WorldItem = {
  id: string;
  type: string;
  title: string;
  organization: string;
  date: string;
  summary?: string;
  link?: string;
  image?: string;
  imageAlt?: string;
};

export default function PublicMomentsSection({
  items,
  knowledge,
  media,
}: PublicMomentsSectionProps) {
  const worldItems: WorldItem[] = [
    ...items,
    ...knowledge.map((item) => ({
      id: item.id,
      type: item.format,
      title: item.title,
      organization: item.venue,
      date: item.date,
      summary: item.summary,
      link: item.link,
    })),
    ...media.map((item) => ({
      id: item.id,
      type: item.format,
      title: item.title,
      organization: item.outlet,
      date: item.date,
      summary: item.summary,
      link: item.link,
    })),
  ];
  const featuredItem = worldItems.find((item) => item.image) ?? worldItems[0];
  const supportingItems = worldItems.filter((item) => item.id !== featuredItem.id);

  return (
    <section className="profile-section profile-public-moments" id="public-moments">
      <div className="profile-public-moments__heading">
        <div>
          <p className="section-eyebrow">IN THE WORLD</p>
          <h2>In the world.</h2>
        </div>

        <p>
          Selected events, publications, conversations, and professional
          moments connected to this identity.
        </p>
      </div>

      <article className="public-moment-feature">
        <div className="public-moment-feature__media">
          {featuredItem.image ? (
            <Image
              src={featuredItem.image}
              alt={featuredItem.imageAlt ?? `${featuredItem.title} professional moment`}
              fill
              sizes="(max-width: 900px) 100vw, 50vw"
            />
          ) : null}
        </div>
        <div className="public-moment-feature__body">
          <div className="public-moment-card__meta">
            <span>{featuredItem.type}</span>
            <span>{featuredItem.organization}</span>
            <span>{featuredItem.date}</span>
          </div>
          <h3>{featuredItem.title}</h3>
          {featuredItem.summary ? <p>{featuredItem.summary}</p> : null}
          {featuredItem.link ? (
            <a href={featuredItem.link} target="_blank" rel="noreferrer" className="public-moment-card__link">
              Explore ↗
            </a>
          ) : null}
        </div>
      </article>

      <div className="public-moments-list">
        {supportingItems.map((item) => (
          <article className="public-moment-card" key={item.id}>
            <div className="public-moment-card__date" aria-label={item.date}>{item.date}</div>
            <div className="public-moment-card__body">
              <div className="public-moment-card__meta">
                <span>{item.type}</span>
                <span>{item.organization}</span>
              </div>
              <h3>{item.title}</h3>
              {item.summary ? <p>{item.summary}</p> : null}
            </div>
            {item.link ? (
              <a href={item.link} target="_blank" rel="noreferrer" className="public-moment-card__link">Explore ↗</a>
            ) : (
              <span className="public-moment-card__link public-moment-card__link--placeholder">Archived</span>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
