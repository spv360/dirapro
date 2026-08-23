import Link from "next/link";
import { notFound } from "next/navigation";
import { demoProfile } from "../../data/profile";

type ProfilePageProps = {
  params: Promise<{
    username: string;
  }>;
};

export default async function ProfilePage({
  params,
}: ProfilePageProps) {
  const { username } = await params;

  if (username !== demoProfile.username) {
    notFound();
  }

  const profile = demoProfile;

  return (
    <main className="profile-page">
      <nav className="profile-nav">
        <Link href="/" className="brand">
          Dira<span>Pro</span>
        </Link>

        <Link href="/" className="profile-nav-back">
            Back to DiraPro ↗
        </Link>
      </nav>

      <section className="profile-hero">
        <div>
          <p className="eyebrow">PROFESSIONAL IDENTITY</p>

          <h1>{profile.name}</h1>

          <h2>{profile.headline}</h2>

          <p className="profile-location">{profile.location}</p>

          <p className="profile-summary">{profile.summary}</p>

          <div className="profile-links">
            {profile.socialLinks.map((link) => (
              <a key={link.label} href={link.href}>
                {link.label} ↗
              </a>
            ))}
          </div>
        </div>

        <aside className="profile-hero-card">
          <span className="profile-card-label">DIRAPRO PROFILE</span>

          <div className="profile-card-placeholder">
            <span>{profile.name.charAt(0)}</span>
          </div>

          <span className="profile-card-status">PROFILE</span>
        </aside>
      </section>

      <section className="profile-section profile-expertise">
        <div className="profile-section-heading">
          <p className="eyebrow">EXPERTISE</p>
          <h2>What I know.</h2>
        </div>

        <div className="expertise-grid">
          {profile.expertise.map((item) => (
            <div key={item} className="expertise-item">
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="profile-section">
        <div className="profile-section-heading">
          <p className="eyebrow">EXPERIENCE</p>
          <h2>Where experience becomes perspective.</h2>
        </div>

        <div className="experience-list">
          {profile.experience.map((item) => (
            <article key={`${item.company}-${item.role}`}>
              <div className="experience-period">{item.period}</div>

              <div>
                <h3>{item.role}</h3>
                <p className="experience-company">{item.company}</p>
                <p>{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="profile-section">
        <div className="profile-section-heading">
          <p className="eyebrow">SELECTED WORK</p>
          <h2>What I have built.</h2>
        </div>

        <div className="project-grid">
          {profile.projects.map((project) => (
            <article key={project.name} className="project-card">
              <div>
                <span className="project-index">PROJECT</span>
                <h3>{project.name}</h3>
                <p>{project.description}</p>
              </div>

              <div className="project-tags">
                {project.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="profile-section">
        <div className="profile-section-heading">
          <p className="eyebrow">KNOWLEDGE & INSIGHTS</p>
          <h2>What I share.</h2>
        </div>

        <div className="knowledge-list">
          {profile.knowledge.map((item) => (
            <article key={item.title}>
                <span>{item.type}</span>

                <div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                </div>
            </article>
          ))}
        </div>
      </section>

      <section className="profile-section profile-evidence">
        <div className="profile-section-heading">
          <p className="eyebrow">EVIDENCE</p>
          <h2>Show the experience behind the expertise.</h2>
        </div>

        <div className="profile-evidence-grid">
          {profile.evidence.map((item) => (
            <div key={item.label}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      <footer className="profile-footer">
        <span>© {new Date().getFullYear()} DiraPro</span>

        <Link href="/">Build your Dira identity ↗</Link>
      </footer>
    </main>
  );
}