import type { Appointment } from "../../data/profile";
import SectionIntro from "./SectionIntro";

type ExperienceSectionProps = {
  biography: string;
  appointments: Appointment[];
};

export default function ExperienceSection({
  biography,
  appointments,
}: ExperienceSectionProps) {
  return (
    <section className="profile-section" id="biography">
      <SectionIntro
        eyebrow="CAREER & APPOINTMENTS"
        title="Where professional experience becomes perspective."
        description="Roles, appointments, and affiliations should work equally well for an academic, a clinician, a public administrator, or a business leader."
        align="split"
      />

      <div className="profile-biography-card">
        <span>BIOGRAPHY</span>
        <p>{biography}</p>
      </div>

      <div className="appointment-list">
        {appointments.map((item) => (
          <article key={item.id} className="appointment-card">
            <div className="appointment-card__rail">
              <span className="appointment-period">{item.period}</span>
            </div>

            <div className="appointment-card__body">
              <div className="appointment-card__meta">
                <span>{item.organizationType}</span>
                {item.location ? <span>{item.location}</span> : null}
              </div>

              <h3>{item.title}</h3>
              <p className="appointment-organization">{item.organization}</p>
              <p className="appointment-summary">{item.summary}</p>

              <ul className="appointment-responsibilities">
                {item.responsibilities.map((responsibility) => (
                  <li key={`${item.id}-${responsibility}`}>{responsibility}</li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}