import type { Achievement } from "../../data/profile";
import SectionIntro from "./SectionIntro";

type AchievementsSectionProps = {
  items: Achievement[];
};

export default function AchievementsSection({
  items,
}: AchievementsSectionProps) {
  return (
    <section className="profile-section" id="achievements">
      <SectionIntro
        eyebrow="ACHIEVEMENTS & RECOGNITION"
        title="Recognition, milestones, and professional trust markers."
        description="Awards, certifications, advisory appointments, and major milestones help people understand how a professional’s work has been recognized or entrusted."
        align="split"
      />

      <div className="achievement-grid">
        {items.map((item) => (
          <article key={item.id} className="achievement-card">
            <div className="achievement-card__top">
              <span>{item.category}</span>
              {item.sourceType ? (
                <span className="achievement-source">{item.sourceType}</span>
              ) : null}
            </div>

            <h3>{item.title}</h3>
            <p className="achievement-issuer">{item.issuer}</p>
            <p className="achievement-period">{item.period}</p>
            {item.description ? <p className="achievement-description">{item.description}</p> : null}
          </article>
        ))}
      </div>
    </section>
  );
}