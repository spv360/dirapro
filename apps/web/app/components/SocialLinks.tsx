type SocialLink = {
  label: string;
  href: string;
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
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          className="social-link"
          aria-label={link.label}
        >
          {link.label}
          <span>↗</span>
        </a>
      ))}
    </div>
  );
}
