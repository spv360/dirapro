import Image from "next/image";
import type { PortfolioItem } from "../../data/profile";
import SectionIntro from "./SectionIntro";

type PortfolioSectionProps = {
  items: PortfolioItem[];
};

export default function PortfolioSection({ items }: PortfolioSectionProps) {
  return (
    <section className="profile-section" id="portfolio">
      <SectionIntro
        eyebrow="MEDIA & PORTFOLIO"
        title="Selected work, made visible."
        description="A considered record of work, with supporting media and references."
        align="split"
      />

      <div className="portfolio-grid">
        {items.map((item) => (
          <article className="portfolio-card" key={item.id}>
            {item.image ? (
              <div className="portfolio-card__media">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(max-width: 700px) 100vw, 50vw"
                  unoptimized={item.image.startsWith("/api/")}
                />
              </div>
            ) : null}
            {item.category ? (
              <p className="portfolio-card__category">{item.category}</p>
            ) : null}
            <h3>{item.title}</h3>
            {item.description ? <p>{item.description}</p> : null}
            {item.url ? (
              <a href={item.url} target="_blank" rel="noreferrer">
                Explore work ↗
              </a>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
