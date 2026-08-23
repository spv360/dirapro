import type { Contribution } from "../../data/profile";
import SectionIntro from "./SectionIntro";

type ContributionsSectionProps = {
  items: Contribution[];
};

export default function ContributionsSection({
  items,
}: ContributionsSectionProps) {
  return (
    <section className="profile-section" id="contributions">
      <SectionIntro
        eyebrow="CONTRIBUTIONS"
        title="What this person has contributed through their work."
        description="Contributions are deliberately broader than projects. They can represent initiatives, ventures, programs, exhibitions, legal work, research, or technology platforms."
        align="split"
      />

      <div className="contribution-grid">
        {items.map((item) => (
          <article key={item.id} className="contribution-card">
            <div className="contribution-card__top">
              <span>{item.contributionType}</span>
              {item.period ? <span>{item.period}</span> : null}
            </div>

            <h3>{item.title}</h3>
            {item.organization ? (
              <p className="contribution-organization">{item.organization}</p>
            ) : null}

            <p className="contribution-summary">{item.summary}</p>

            {item.impact ? <p className="contribution-impact">{item.impact}</p> : null}

            <div className="contribution-tags">
              {item.tags.map((tag) => (
                <span key={`${item.id}-${tag}`}>{tag}</span>
              ))}
            </div>

            {item.link ? (
              <a href={item.link} target="_blank" rel="noreferrer" className="contribution-link">
                Related reference ↗
              </a>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}