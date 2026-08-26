import type { EvidenceSignal } from "../../data/profile";
import SectionIntro from "./SectionIntro";

type EvidenceSectionProps = {
  items: EvidenceSignal[];
};

export default function EvidenceSection({ items }: EvidenceSectionProps) {
  return (
    <section className="profile-section profile-section--evidence" id="evidence">
      <SectionIntro
        eyebrow="IDENTITY SIGNALS"
        title="Identity Signals"
        description="A concise view of the work and recognition behind this identity."
        align="split"
      />

      <div className="evidence-grid">
        {items.map((item) => (
          <article key={item.id} className="profile-evidence-card">
            <strong>{item.value}</strong>
            <span>{item.label}</span>
            {item.context ? <p>{item.context}</p> : null}
          </article>
        ))}
      </div>
    </section>
  );
}