import type { EducationItem } from "../../data/profile";
import SectionIntro from "./SectionIntro";

export default function EducationSection({ items }: { items: EducationItem[] }) {
  return (
    <section className="profile-section" id="education">
      <SectionIntro
        eyebrow="EDUCATION"
        title="Formal learning and qualifications."
        description="Institutions and qualifications that shaped this professional's foundation."
        align="split"
      />

      <div className="appointment-list">
        {items.map((item) => (
          <article key={item.id} className="appointment-card">
            <div className="appointment-card__rail">
              <span className="appointment-period">{item.period}</span>
            </div>
            <div className="appointment-card__body">
              <h3>{item.institution}</h3>
              {item.qualification ? <p className="appointment-organization">{item.qualification}</p> : null}
              {item.description ? <p className="appointment-summary">{item.description}</p> : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
