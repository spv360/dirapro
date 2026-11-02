import type { KnowledgeItem } from "../../data/profile";
import SectionIntro from "./SectionIntro";

type KnowledgeSectionProps = {
  items: KnowledgeItem[];
};

export default function KnowledgeSection({ items }: KnowledgeSectionProps) {
  return (
    <section className="profile-section" id="knowledge">
      <SectionIntro
        eyebrow="KNOWLEDGE & PUBLICATIONS"
        title="What this professional shares publicly."
        description="Knowledge can take many forms: articles, books, talks, lectures, research, podcasts, and educational content."
        align="split"
      />

      <div className="knowledge-stack">
        {items.map((item) => (
          <article key={item.id} className="knowledge-card">
            {item.format || item.venue || item.date ? (
              <div className="knowledge-card__meta">
                {item.format ? <span>{item.format}</span> : null}
                {item.venue ? <span>{item.venue}</span> : null}
                {item.date ? <span>{item.date}</span> : null}
              </div>
            ) : null}

            <h3>{item.title}</h3>
            <p>{item.summary}</p>

            {item.relevantTopics?.length ? (
              <div className="contribution-tags" aria-label="Relevant topics">
                {item.relevantTopics.map((topic) => <span key={topic}>{topic}</span>)}
              </div>
            ) : null}

            {item.link ? (
              <a href={item.link} target="_blank" rel="noreferrer">
                View reference ↗
              </a>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}