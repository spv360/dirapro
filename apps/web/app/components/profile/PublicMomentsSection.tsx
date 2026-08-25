import type { PublicMoment } from "../../data/profile";

type PublicMomentsSectionProps = {
  items: PublicMoment[];
};

export default function PublicMomentsSection({
  items,
}: PublicMomentsSectionProps) {
  return (
    <section className="profile-section profile-public-moments" id="public-moments">
      <div className="profile-public-moments__heading">
        <div>
          <p className="section-eyebrow">PUBLIC MOMENTS</p>
          <h2>In the world.</h2>
        </div>

        <p>
          Selected events, publications, conversations, and professional
          moments connected to this identity.
        </p>
      </div>

      <div className="public-moments-list">
        {items.map((item) => (
          <article className="public-moment-card" key={item.id}>
            <div className="public-moment-card__date" aria-label={item.date}>
              {item.date}
            </div>

            <div className="public-moment-card__body">
              <div className="public-moment-card__meta">
                <span>{item.type}</span>
                <span>{item.organization}</span>
              </div>

              <h3>{item.title}</h3>

              {item.summary ? <p>{item.summary}</p> : null}
            </div>

            {item.link ? (
              <a
                href={item.link}
                target="_blank"
                rel="noreferrer"
                className="public-moment-card__link"
              >
                Explore ↗
              </a>
            ) : (
              <span className="public-moment-card__link public-moment-card__link--placeholder">
                Archived
              </span>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
