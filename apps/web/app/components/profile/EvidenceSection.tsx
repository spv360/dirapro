import type { EvidenceSignal } from "../../data/profile";
import SectionIntro from "./SectionIntro";

type EvidenceSectionProps = {
  items: EvidenceSignal[];
};

export default function EvidenceSection({ items }: EvidenceSectionProps) {
  return (
    <section className="profile-section profile-section--evidence" id="evidence">
      <SectionIntro
        eyebrow="EVIDENCE"
        title="What supports this professional identity."
        description="Evidence should reinforce the profile with credibility signals, not overwhelm it with dashboard behavior."
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