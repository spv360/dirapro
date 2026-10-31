export const JOURNEY_TYPES = [
  "Insight",
  "Building",
  "Speaking",
  "Achievement",
  "Publication",
  "Learning",
  "Event",
  "Announcement",
] as const;

export const JOURNEY_STATUSES = ["draft", "published", "archived"] as const;
export const JOURNEY_VISIBILITIES = ["public", "private"] as const;

export type JourneyType = (typeof JOURNEY_TYPES)[number];
export type JourneyStatus = (typeof JOURNEY_STATUSES)[number];
export type JourneyVisibility = (typeof JOURNEY_VISIBILITIES)[number];

export type JourneyMedia = {
  kind: "image" | "video";
  /** Stored file name; served from /api/journey/media/[file]. Never inline data. */
  file: string;
  mimeType: string;
  size: number;
  alt?: string;
};

/** A reference to a Journey item from the Current Moment carousel. */
export type CurrentMomentReference = {
  featuredAt: string;
};

export type JourneyItem = {
  id: string;
  profileId: string;
  type: JourneyType;
  title: string;
  description: string;
  /** Date the update refers to (YYYY-MM-DD). */
  date: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  media: JourneyMedia | null;
  tags: string[];
  organization: string;
  externalUrl: string;
  visibility: JourneyVisibility;
  status: JourneyStatus;
  featured: boolean;
  currentMomentReference: CurrentMomentReference | null;
};

/** Fields the owner can write. Server-controlled fields are never accepted from clients. */
export type JourneyInput = {
  type: JourneyType;
  title: string;
  description: string;
  date: string;
  media: JourneyMedia | null;
  tags: string[];
  organization: string;
  externalUrl: string;
  visibility: JourneyVisibility;
  status: JourneyStatus;
  featured: boolean;
  currentMoment: boolean;
};

export const MEDIA_RULES = {
  image: {
    mimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxBytes: 8 * 1024 * 1024,
  },
  video: {
    mimeTypes: ["video/mp4", "video/webm"],
    maxBytes: 60 * 1024 * 1024,
  },
} as const;

export const MEDIA_ACCEPT = [
  ...MEDIA_RULES.image.mimeTypes,
  ...MEDIA_RULES.video.mimeTypes,
].join(",");

export function mediaKindFor(mimeType: string): "image" | "video" | null {
  if ((MEDIA_RULES.image.mimeTypes as readonly string[]).includes(mimeType)) return "image";
  if ((MEDIA_RULES.video.mimeTypes as readonly string[]).includes(mimeType)) return "video";
  return null;
}

/** Client- and server-safe pre-check on file metadata. Returns an error message or null. */
export function validateMediaFile(file: { type: string; size: number }): string | null {
  const kind = mediaKindFor(file.type);
  if (!kind) return "Unsupported file type. Use JPEG, PNG or WebP images, or MP4 / WebM video.";
  if (file.size <= 0) return "This file is empty.";
  if (file.size > MEDIA_RULES[kind].maxBytes) {
    return `${kind === "image" ? "Images" : "Videos"} must be under ${MEDIA_RULES[kind].maxBytes / 1024 / 1024} MB.`;
  }
  return null;
}

const FILE_PATTERN = /^[a-f0-9-]{36}\.(jpg|png|webp|mp4|webm)$/;

export function isValidMediaFile(file: string): boolean {
  return FILE_PATTERN.test(file);
}

export function mediaUrl(media: JourneyMedia): string {
  return `/api/journey/media/${media.file}`;
}

function oneOf<T extends string>(list: readonly T[], value: unknown): value is T {
  return typeof value === "string" && (list as readonly string[]).includes(value);
}

export type ValidationResult =
  | { ok: true; value: JourneyInput }
  | { ok: false; errors: Record<string, string> };

/** Strictly validates untrusted input into a JourneyInput. Used by the API; the form reuses it for preview. */
export function validateJourneyInput(raw: unknown): ValidationResult {
  const errors: Record<string, string> = {};
  const body = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const text = (key: string) => (typeof body[key] === "string" ? (body[key] as string).trim() : "");

  const title = text("title");
  const description = text("description");
  const organization = text("organization");
  const externalUrl = text("externalUrl");
  const date = text("date");

  if (!oneOf(JOURNEY_TYPES, body.type)) errors.type = "Choose a content type.";
  if (!title) errors.title = "Add a title.";
  else if (title.length > 140) errors.title = "Keep the title under 140 characters.";
  if (description.length > 2000) errors.description = "Keep the description under 2000 characters.";
  if (organization.length > 120) errors.organization = "Keep the organization under 120 characters.";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) {
    errors.date = "Choose a valid date.";
  }

  if (externalUrl) {
    try {
      const url = new URL(externalUrl);
      if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("protocol");
    } catch {
      errors.externalUrl = "Enter a valid http(s) URL.";
    }
  }

  if (!oneOf(JOURNEY_STATUSES, body.status)) errors.status = "Invalid status.";
  if (!oneOf(JOURNEY_VISIBILITIES, body.visibility)) errors.visibility = "Invalid visibility.";

  const rawTags = Array.isArray(body.tags) ? body.tags : [];
  const tags = Array.from(
    new Set(
      rawTags
        .filter((tag): tag is string => typeof tag === "string")
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  );
  if (tags.length > 8) errors.tags = "Use at most 8 tags.";
  else if (tags.some((tag) => tag.length > 32)) errors.tags = "Keep each tag under 32 characters.";

  let media: JourneyMedia | null = null;
  if (body.media) {
    const m = body.media as Partial<JourneyMedia>;
    if (
      (m.kind === "image" || m.kind === "video") &&
      typeof m.file === "string" &&
      isValidMediaFile(m.file) &&
      typeof m.mimeType === "string" &&
      mediaKindFor(m.mimeType) === m.kind &&
      typeof m.size === "number"
    ) {
      media = {
        kind: m.kind,
        file: m.file,
        mimeType: m.mimeType,
        size: m.size,
        alt: typeof m.alt === "string" ? m.alt.trim().slice(0, 200) || undefined : undefined,
      };
    } else {
      errors.media = "Invalid media attachment.";
    }
  }

  const currentMoment = body.currentMoment === true;
  if (currentMoment && media?.kind !== "image") {
    errors.currentMoment = "Current Moment needs an image.";
  }

  if (Object.keys(errors).length) return { ok: false, errors };

  return {
    ok: true,
    value: {
      type: body.type as JourneyType,
      title,
      description,
      date,
      media,
      tags,
      organization,
      externalUrl,
      visibility: body.visibility as JourneyVisibility,
      status: body.status as JourneyStatus,
      featured: body.featured === true,
      currentMoment,
    },
  };
}

export function formatJourneyDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}
