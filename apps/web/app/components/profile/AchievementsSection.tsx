import Image from "next/image";
import type { Achievement } from "../../data/profile";
import SectionIntro from "./SectionIntro";

type AchievementsSectionProps = {
  items: Achievement[];
};

export default function AchievementsSection({
  items,
}: AchievementsSectionProps) {
  return (
    <section className="profile-section profile-section--recognition" id="achievements">
      <SectionIntro
        eyebrow="ACHIEVEMENTS & RECOGNITION"
        title="Recognition, milestones, and professional trust markers."
        description="Awards, certifications, advisory appointments, and major milestones help people understand how a professional’s work has been recognized or entrusted."
        align="split"
      />

      <div className="achievement-grid">
        {items.map((item, index) => (
          <article key={item.id} className={`achievement-card ${index === 0 ? "achievement-card--featured" : ""}`}>
            {item.image ? (
              <div className="achievement-card__media">
                <Image src={item.image} alt={item.imageAlt ?? item.title} fill sizes="(max-width: 900px) 100vw, 42vw" />
              </div>
            ) : null}
            <div className="achievement-card__details">
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
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}