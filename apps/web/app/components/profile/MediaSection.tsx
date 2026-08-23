import type { MediaItem } from "../../data/profile";
import SectionIntro from "./SectionIntro";

type MediaSectionProps = {
  items: MediaItem[];
};

export default function MediaSection({ items }: MediaSectionProps) {
  return (
    <section className="profile-section" id="media">
      <SectionIntro
        eyebrow="MEDIA & APPEARANCES"
        title="Where this professional appears in public."
        description="Media and public appearances connect a profile to interviews, conference stages, press coverage, podcasts, and public-facing conversations."
        align="split"
      />

      <div className="media-grid">
        {items.map((item) => (
          <article key={item.id} className="media-card">
            <div className="media-card__meta">
              <span>{item.format}</span>
              <span>{item.outlet}</span>
              <span>{item.date}</span>
            </div>

            <h3>{item.title}</h3>
            <p>{item.summary}</p>

            {item.link ? (
              <a href={item.link} target="_blank" rel="noreferrer">
                Open source ↗
              </a>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}