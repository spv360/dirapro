import type { DiraProfile, PublicPresenceCategory } from "../../data/profile";
import type { MediaRef, ProfileAggregate } from "./types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const mediaUrl = (profileId: string, ref: MediaRef | null | undefined) =>
  ref ? `/api/media/profile/${profileId}/${ref.file}` : undefined;

function month(value: string): string {
  const [year, m] = value.split("-");
  return m ? `${MONTHS[Number(m) - 1] ?? ""} ${year}`.trim() : year ?? "";
}

const period = (start: string, end: string, current: boolean, fmt: (v: string) => string = month) =>
  [start ? fmt(start) : "", current ? "Present" : end ? fmt(end) : ""].filter(Boolean).join(" – ");

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("") || "?";

const CATEGORY: Record<string, PublicPresenceCategory> = { LinkedIn: "social", X: "social", Instagram: "social", YouTube: "social", GitHub: "professional", Website: "professional", Other: "professional" };
const KIND_LABEL = { certification: "Certification", award: "Award", recognition: "Recognition" } as const;
const TYPE_LABEL = { project: "Project", "open-source": "Open source", publication: "Publication", achievement: "Achievement" } as const;

/** Pure mapping from stored profile data to the renderer's DiraProfile shape. */
export function toDiraProfile(agg: ProfileAggregate): DiraProfile {
  const p = agg.profile;
  const sentences = p.biography.split(/(?<=[.!?])\s+/);
  const preview = sentences.slice(0, 2).join(" ");

  return {
    username: p.username,
    identity: {
      name: p.fullName,
      headline: p.headline,
      location: p.location,
      shortSummary: p.knownFor || preview,
      biographyPreview: preview,
      biography: p.biography,
      initials: initials(p.fullName),
      image: mediaUrl(p.id, p.profileImage),
      coverImage: mediaUrl(p.id, p.coverImage),
    },
    expertise: agg.expertise.map((e, i) => ({ id: e.id, name: e.name, context: e.category === "expertise" ? undefined : e.category, featured: i < 4 })),
    appointments: agg.experience.map((e) => ({
      id: e.id,
      title: e.title,
      organization: e.organization,
      organizationType: e.employmentType,
      period: period(e.startDate, e.endDate, e.current),
      location: e.location || undefined,
      summary: e.description,
      responsibilities: [],
    })),
    achievements: agg.recognition.map((r) => ({
      id: r.id,
      title: r.title,
      category: KIND_LABEL[r.kind],
      issuer: r.issuer,
      period: r.issueDate ? month(r.issueDate) : "",
      description: r.description || undefined,
      link: r.credentialUrl || undefined,
    })),
    education: agg.education.map((e) => ({
      id: e.id,
      institution: e.institution,
      qualification: [e.qualification, e.fieldOfStudy].filter(Boolean).join(", "),
      period: period(e.startDate, e.endDate, false, (v) => v),
      description: e.description || undefined,
    })),
    contributions: agg.contributions.map((c) => ({
      id: c.id,
      title: c.title,
      contributionType: TYPE_LABEL[c.type],
      summary: c.description,
      tags: [],
      link: c.url || undefined,
      image: mediaUrl(p.id, c.media),
      imageAlt: c.media ? c.title : undefined,
    })),
    knowledge: [],
    media: [],
    publicPresence: agg.links.map((l, i) => ({
      id: l.id,
      platform: l.platform === "Other" ? l.label || "Link" : l.platform,
      label: l.label || l.platform,
      url: l.url,
      category: CATEGORY[l.platform] ?? "professional",
      featured: i < 3,
    })),
    evidence: [
      { id: "ev-exp", label: "Roles", value: String(agg.experience.length) },
      { id: "ev-rec", label: "Recognitions", value: String(agg.recognition.length) },
      { id: "ev-con", label: "Contributions", value: String(agg.contributions.length) },
      { id: "ev-exp2", label: "Areas of expertise", value: String(agg.expertise.length) },
    ].filter((e) => e.value !== "0"),
    currentMoment: { updated: "", moments: [] },
    publicMoments: [],
    connection: { enabled: false, label: "" },
  };
}
