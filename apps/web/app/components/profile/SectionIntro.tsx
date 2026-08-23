type SectionIntroProps = {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "split";
};

export default function SectionIntro({
  eyebrow,
  title,
  description,
  align = "left",
}: SectionIntroProps) {
  return (
    <header className={`profile-section-intro profile-section-intro--${align}`}>
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>

      {description ? <p>{description}</p> : null}
    </header>
  );
}