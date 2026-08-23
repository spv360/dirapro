type ProfessionalCardProps = {
  featured?: boolean;
};

export default function ProfessionalCard({
  featured = true,
}: ProfessionalCardProps) {
  return (
    <div className={`professional-card ${featured ? "is-featured" : ""}`}>
      <div className="professional-card__top">
        <span>DIRAPRO PROFILE</span>
        <span className="professional-card__verified">● VERIFIED</span>
      </div>

      <div className="professional-card__portrait">
        <div className="portrait-orbit portrait-orbit--one" />
        <div className="portrait-orbit portrait-orbit--two" />

        <div className="portrait-person">
          <div className="portrait-head" />
          <div className="portrait-body" />
        </div>

        <span className="portrait-label">PROFESSIONAL IDENTITY</span>
      </div>

      <div className="professional-card__content">
        <p className="professional-card__role">
          EXPERT · EDUCATOR · LEADER
        </p>

        <h2>Someone worth knowing.</h2>

        <p className="professional-card__description">
          A structured professional identity built around expertise,
          experience, knowledge, and impact.
        </p>

        <div className="professional-card__metrics">
          <div>
            <strong>18+</strong>
            <span>Years Experience</span>
          </div>

          <div>
            <strong>06</strong>
            <span>Areas of Expertise</span>
          </div>

          <div>
            <strong>24</strong>
            <span>Knowledge Pieces</span>
          </div>
        </div>

        <div className="professional-card__tags">
          <span>Professional Identity</span>
          <span>Expertise</span>
          <span>Knowledge</span>
          <span>Stories</span>
        </div>
      </div>
    </div>
  );
}