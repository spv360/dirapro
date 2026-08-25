import type { CurrentMoment } from "../../data/profile";

type CurrentMomentSectionProps = {
  moment: CurrentMoment;
};

export default function CurrentMomentSection({
  moment,
}: CurrentMomentSectionProps) {
  return (
    <section className="profile-current-moment" id="current-moment">
      <div className="profile-current-moment__intro">
        <p className="section-eyebrow">CURRENT MOMENT</p>
        <p className="profile-current-moment__updated">
          Updated {moment.updated}
        </p>
      </div>

      <div className="profile-current-moment__content">
        <h2>{moment.statement}</h2>

        <div className="profile-current-moment__focus">
          {moment.focus.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
