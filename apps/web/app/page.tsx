import Link from "next/link";
import ProfessionalCard from "./components/ProfessionalCard";
import Reveal from "./components/Reveal";
import SocialLinks from "./components/SocialLinks";

const profileHighlights = [
  "Professional Identity",
  "Expertise & Experience",
  "Knowledge & Insights",
  "Stories & Media",
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
        <section id="professionals" className="pillars-section">
          <div className="section-heading">
            <p className="eyebrow">THE FOUNDATION</p>

            <h2>Built around what makes you, you.</h2>
          </div>

          <div className="pillar-grid">
            {profileHighlights.map((item, index) => (
              <article className="pillar-card" key={item}>
                <span>0{index + 1}</span>

                <h3>{item}</h3>

                <p>
                  A thoughtful digital layer for representing the depth behind
                  a professional career.
                </p>
              </article>
            ))}
          </div>
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