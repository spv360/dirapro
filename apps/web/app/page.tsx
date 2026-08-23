import Link from "next/link";
import ProfessionalCard from "./components/ProfessionalCard";
import Reveal from "./components/Reveal";
import SocialLinks from "./components/SocialLinks";

const profileHighlights = [
  {
    title: "Professional Identity",
    description:
      "Your professional introduction, focus, positioning, and public identity.",
  },
  {
    title: "Expertise & Experience",
    description:
      "Skills, domains, roles, achievements, and the work behind your experience.",
  },
  {
    title: "Knowledge & Insights",
    description:
      "Articles, ideas, research, lessons, talks, and perspectives.",
  },
  {
    title: "Stories & Media",
    description:
      "Projects, interviews, videos, presentations, and moments from your journey.",
  },
];

export default function Home() {
  return (
    <main>
      <nav className="site-nav">
        <Link href="/" className="brand">
          Dira<span>Pro</span>
        </Link>

        <div className="nav-links">
          <Link href="#platform">Platform</Link>
          <Link href="#professionals">Professionals</Link>
          <Link href="#about">About</Link>
        </div>

        <Link href="#connect" className="nav-cta">
          Get Started
        </Link>
      </nav>

      <section className="hero">
        <div className="hero-ambient" />

        <div className="hero-content hero-enter">
          <p className="eyebrow">PROFESSIONAL IDENTITY & KNOWLEDGE</p>

          <h1>
            Your expertise
            <br />
            deserves a <em>digital identity.</em>
          </h1>

          <p className="hero-description">
            DiraPro helps professionals bring their expertise, experience,
            achievements, knowledge, and professional story together into a
            credible digital presence.
          </p>

          <div className="hero-actions">
            <Link href="#professionals" className="button button-primary">
              Explore DiraPro
            </Link>

            <Link href="#about" className="button button-secondary">
              Discover the idea <span>↗</span>
            </Link>
          </div>
        </div>

        <div
          className="hero-visual hero-card-enter"
          aria-label="DiraPro professional identity preview"
        >
          <ProfessionalCard featured={true} />
        </div>
      </section>

      <Reveal>
        <section id="platform" className="statement-section">
          <p className="eyebrow">
            A DIFFERENT KIND OF PROFESSIONAL PRESENCE
          </p>

          <h2>
            More than a profile.
            <br />
            <span>A professional story.</span>
          </h2>

          <p>
            Your career is more than a title or a list of achievements.
            DiraPro brings the different dimensions of your professional
            journey together so they can be discovered, understood, and
            remembered.
          </p>
        </section>
      </Reveal>

      <Reveal>
          <section className="scattered-section">
            <div className="section-heading">
              <p className="eyebrow">THE PROBLEM</p>

              <h2>
                Your professional identity
                <br />
                <span>is scattered.</span>
              </h2>
            </div>

          <div className="identity-map">
            <div className="identity-sources">
              <div>
                <strong>LinkedIn</strong>
                <span>Career</span>
              </div>

              <div>
                <strong>GitHub</strong>
                <span>Work</span>
              </div>

              <div>
                <strong>YouTube</strong>
                <span>Knowledge</span>
              </div>

              <div>
                <strong>Articles</strong>
                <span>Insights</span>
              </div>

              <div>
                <strong>Projects</strong>
                <span>Experience</span>
              </div>

              <div>
                <strong>Website</strong>
                <span>Story</span>
              </div>
            </div>

            <div className="identity-connector">
              <span>↓</span>
            </div>

            <div className="identity-dira">
              <span className="identity-dira__label">DIRAPRO</span>
              <strong>One professional identity.</strong>
              <p>
                Bring your expertise, experience, knowledge, work, and story
                together in one place.
              </p>
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section id="professionals" className="pillars-section">
          <div className="section-heading">
            <p className="eyebrow">THE FOUNDATION</p>

            <h2>Built around what makes you, you.</h2>
          </div>

          <div className="pillar-grid">
            {profileHighlights.map((item, index) => (
              <article className="pillar-card" key={item.title}>
                <span>0{index + 1}</span>

                <h3>{item.title}</h3>

                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </section>
      </Reveal>

              <Reveal>
          <section className="evidence-section">
            <div className="evidence-heading">
              <p className="eyebrow">THE EVIDENCE</p>

              <h2>
                Don&apos;t just say
                <br />
                <span>what you know.</span>
                <br />
                Show it.
              </h2>
            </div>

            <div className="evidence-card">
              <div className="evidence-card__top">
                <div>
                  <span className="evidence-label">EXPERTISE</span>
                  <h3>Cloud Architecture</h3>
                </div>

                <span className="evidence-status">SUPPORTED</span>
              </div>

              <div className="evidence-tags">
                <span>AI Infrastructure</span>
                <span>Platform Engineering</span>
                <span>Cloud Architecture</span>
              </div>

              <div className="evidence-divider" />

              <div className="evidence-metrics">
                <div>
                  <strong>16+</strong>
                  <span>Years experience</span>
                </div>

                <div>
                  <strong>42</strong>
                  <span>Projects</span>
                </div>

                <div>
                  <strong>12</strong>
                  <span>Publications</span>
                </div>

                <div>
                  <strong>8</strong>
                  <span>Talks &amp; presentations</span>
                </div>
              </div>
            </div>

            <p className="evidence-description">
              Expertise becomes more credible when people can see the
              experience, work, knowledge, and achievements behind it.
            </p>
          </section>
        </Reveal>

      <Reveal>
        <section id="about" className="about-section">
          <div>
            <p className="eyebrow">THE DIRAPRO PHILOSOPHY</p>

            <h2>
              AI amplifies expertise. It does not manufacture credibility.
            </h2>
          </div>

          <p>
            DiraPro is being built around people first. Technology and AI
            should make professional knowledge easier to organize, publish,
            discover, and preserve while keeping authenticity, evidence, and
            trust at the center.
          </p>
        </section>
      </Reveal>

      <Reveal>
        <section className="presence-section">
          <div>
            <p className="eyebrow">PROFESSIONAL PRESENCE</p>

            <h2>
              One identity.
              <br />
              Many places.
            </h2>
          </div>

          <div>
            <p>
              DiraPro can become the central layer connecting a professional
              identity with the platforms, publications, media, and knowledge
              that already represent them online.
            </p>

            <SocialLinks />
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section id="connect" className="cta-section">
          <p className="eyebrow">THE BEGINNING</p>

          <h2>Build a digital identity that grows with you.</h2>

          <p>
            DiraPro is beginning with a focused professional community and a
            global ambition.
          </p>

          <Link
            href="mailto:hello@dirapro.in"
            className="button button-primary"
          >
            Connect with DiraPro
          </Link>
        </section>
      </Reveal>

      <footer>
        <span>© {new Date().getFullYear()} DiraPro</span>
        <span>Professional Identity & Knowledge</span>
      </footer>
    </main>
  );
}