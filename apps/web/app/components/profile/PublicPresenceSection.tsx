import type { PublicPresenceLink } from "../../data/profile";
import PresenceLinkGroup from "./PresenceLinkGroup";
import SectionIntro from "./SectionIntro";

type PublicPresenceSectionProps = {
  links: PublicPresenceLink[];
  name?: string;
};

const groupDescriptions = {
  social:
    "Public updates, talks, and events.",
  professional:
    "Official professional and institutional profiles.",
  research:
    "Research and publication identity.",
} as const;

export default function PublicPresenceSection({
  links,
  name = "Alex Morgan",
}: PublicPresenceSectionProps) {
  const socialLinks = links.filter((link) => link.category === "social");
  const professionalLinks = links.filter(
    (link) => link.category === "professional",
  );
  const researchLinks = links.filter((link) => link.category === "research");

  return (
    <section className="profile-section" id="public-presence">
      <SectionIntro
        eyebrow="PUBLIC PRESENCE"
        title="Public Presence"
        description={`Official places to find ${name} across the public web.`}
        align="split"
      />

      <div className="presence-groups">
        {socialLinks.length > 0 ? (
          <PresenceLinkGroup
            title="Social"
            description={groupDescriptions.social}
            links={socialLinks}
          />
        ) : null}

        {professionalLinks.length > 0 ? (
          <PresenceLinkGroup
            title="Professional"
            description={groupDescriptions.professional}
            links={professionalLinks}
          />
        ) : null}

        {researchLinks.length > 0 ? (
          <PresenceLinkGroup
            title="Research & Knowledge"
            description={groupDescriptions.research}
            links={researchLinks}
          />
        ) : null}
      </div>
    </section>
  );
}