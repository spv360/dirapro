import type { ExpertiseItem } from "../../data/profile";
import SectionIntro from "./SectionIntro";

type ExpertiseSectionProps = {
  items: ExpertiseItem[];
};

export default function ExpertiseSection({ items }: ExpertiseSectionProps) {
  return (
    <section className="profile-section profile-expertise" id="expertise">
      <SectionIntro
        eyebrow="AREAS OF EXPERTISE"
        title="What this professional is known for."
        description="Expertise in Dira is more than a list of skills. It should indicate the domains, judgment, and professional capability that shape a person’s work."
        align="split"
      />

      <ol className="expertise-ledger">
        {items.map((item, index) => (
          <li
            key={item.id}
            className={`expertise-ledger__item ${item.featured ? "expertise-ledger__item--featured" : ""}`}
          >
            <span className="expertise-ledger__index">
              {String(index + 1).padStart(2, "0")}
            </span>

            <div className="expertise-ledger__content">
              <h3>{item.name}</h3>
              {item.context ? <p>{item.context}</p> : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}