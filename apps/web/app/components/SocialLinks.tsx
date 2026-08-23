export type SocialLink = {
  label: string;
  href: string;
  descriptor?: string;
  tone?: "linkedin" | "youtube" | "scholar" | "institutional" | "default";
};

type SocialLinksProps = {
  links?: SocialLink[];
};

const defaultLinks: SocialLink[] = [
  {
    label: "LinkedIn",
    href: "#",
  },
  {
    label: "YouTube",
    href: "#",
  },
  {
    label: "Instagram",
    href: "#",
  },
];

export default function SocialLinks({
  links = defaultLinks,
}: SocialLinksProps) {
  return (
    <div className="social-links" aria-label="Professional social links">
      {links.map((link) => {
        const mark = link.label.slice(0, 2).toUpperCase();

        return (
          <a
            key={link.label}
            href={link.href}
            className={`social-link social-link--${link.tone ?? "default"}`}
            aria-label={link.label}
          >
            <div className="social-link__meta">
              <span className="social-link__mark" aria-hidden="true">
                {mark}
              </span>
              <div>
                <strong>{link.label}</strong>
                {link.descriptor ? <small>{link.descriptor}</small> : null}
              </div>
            </div>
            <span className="social-link__arrow" aria-hidden="true">
              ↗
            </span>
          </a>
        );
      })}
    </div>
  );
}
