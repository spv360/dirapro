import type { PublicPresenceLink } from "../../data/profile";
import PresenceLinkGroup from "./PresenceLinkGroup";
import SectionIntro from "./SectionIntro";

type PublicPresenceSectionProps = {
  links: PublicPresenceLink[];
};

const groupDescriptions = {
  social:
    "Channels where this professional publishes updates, commentary, talks, or public-facing activity.",
  professional:
    "Official profiles and institutional surfaces that represent current work, appointments, or practice.",
  research:
    "Profiles that support publication discovery, persistent scholarly identity, or research presence.",
} as const;

export default function PublicPresenceSection({
  links,
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
        title="Where to find this professional across the public web."
        description="Public presence is a first-class part of identity in Dira. It should clearly connect people to official, professional, and research surfaces without turning into a generic social link list."
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