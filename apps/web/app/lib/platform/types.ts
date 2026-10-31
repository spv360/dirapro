/**
 * Multi-user domain model. Plain data only (no behaviour) so it maps directly to
 * PostgreSQL tables later: one table per entity, uuid keys, profile_id foreign keys.
 */

export type User = {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
};

/** The only user shape that may ever reach a browser. */
export type PublicUser = { id: string; email: string };

export type ProfileStatus = "draft" | "published";

export type MediaRef = {
  /** Stored file name, never a path. Resolved against the owning profile by the storage adapter. */
  file: string;
  mimeType: string;
  size: number;
};

export type Profile = {
  id: string;
  ownerId: string;
  username: string;
  fullName: string;
  headline: string;
  biography: string;
  knownFor: string;
  interests: string[];
  careerFocus: string;
  location: string;
  profileImage: MediaRef | null;
  coverImage: MediaRef | null;
  status: ProfileStatus;
  /** Last onboarding step the owner reached (0-based) so they can resume. */
  onboardingStep: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
};

export const EXPERTISE_CATEGORIES = ["expertise", "skill", "technology", "industry", "domain"] as const;
export type ExpertiseCategory = (typeof EXPERTISE_CATEGORIES)[number];

export const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Freelance", "Self-employed", "Board / advisory", "Internship", "Volunteer"] as const;

export const RECOGNITION_KINDS = ["certification", "award", "recognition"] as const;
export type RecognitionKind = (typeof RECOGNITION_KINDS)[number];

export const CONTRIBUTION_TYPES = ["project", "open-source", "publication", "achievement"] as const;
export type ContributionType = (typeof CONTRIBUTION_TYPES)[number];

export const LINK_PLATFORMS = ["LinkedIn", "GitHub", "YouTube", "X", "Instagram", "Website", "Other"] as const;
export type LinkPlatform = (typeof LINK_PLATFORMS)[number];

type Owned = { id: string; profileId: string; sortOrder: number };

export type Expertise = Owned & { name: string; category: ExpertiseCategory };

export type Experience = Owned & {
  organization: string;
  title: string;
  employmentType: string;
  location: string;
  /** YYYY-MM */
  startDate: string;
  /** YYYY-MM, empty while current */
  endDate: string;
  current: boolean;
  description: string;
};

export type Education = Owned & {
  institution: string;
  qualification: string;
  fieldOfStudy: string;
  /** YYYY */
  startDate: string;
  endDate: string;
  description: string;
};

export type Recognition = Owned & {
  kind: RecognitionKind;
  title: string;
  issuer: string;
  /** YYYY-MM */
  issueDate: string;
  credentialUrl: string;
  description: string;
};

export type Contribution = Owned & {
  title: string;
  type: ContributionType;
  description: string;
  url: string;
  media: MediaRef | null;
};

export type PublicLink = Owned & { platform: LinkPlatform; label: string; url: string };

export type ProfileAggregate = {
  profile: Profile;
  expertise: Expertise[];
  experience: Experience[];
  education: Education[];
  recognition: Recognition[];
  contributions: Contribution[];
  links: PublicLink[];
};

export type ListSection = "expertise" | "experience" | "education" | "recognition" | "contributions" | "presence";
export type ProfileSection = "identity" | "about" | "progress" | ListSection;

/** Writable shape of a list entry: server assigns profileId and sortOrder. */
export type Input<T> = Omit<T, "profileId" | "sortOrder" | "id"> & { id?: string };

export type IdentityInput = {
  fullName: string;
  headline: string;
  username: string;
  location: string;
  profileImage: MediaRef | null;
  coverImage: MediaRef | null;
};

export type AboutInput = {
  biography: string;
  knownFor: string;
  interests: string[];
  careerFocus: string;
};

export type SectionItems = {
  expertise: Input<Expertise>[];
  experience: Input<Experience>[];
  education: Input<Education>[];
  recognition: Input<Recognition>[];
  contributions: Input<Contribution>[];
  presence: Input<PublicLink>[];
};
