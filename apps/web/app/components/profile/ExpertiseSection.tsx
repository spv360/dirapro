import type { ExpertiseItem } from "../../data/profile";
import SectionIntro from "./SectionIntro";

type ExpertiseSectionProps = {
  items: ExpertiseItem[];
};

export default function ExpertiseSection({ items }: ExpertiseSectionProps) {
  return (
    <section className="profile-section" id="expertise">
      <SectionIntro
        eyebrow="AREAS OF EXPERTISE"
        title="What this professional is known for."
        description="Expertise in Dira is more than a list of skills. It should indicate the domains, judgment, and professional capability that shape a person’s work."
        align="split"
      />

      <div className="expertise-grid">
        {items.map((item) => (
          <article
            key={item.id}
            className={`expertise-card ${item.featured ? "expertise-card--featured" : ""}`}
          >
            <span className="expertise-card__badge">
              {item.featured ? "Featured expertise" : "Expertise"}
            </span>
            <h3>{item.name}</h3>
            {item.context ? <p>{item.context}</p> : null}
          </article>
        ))}
      </div>
    </section>
  );
}