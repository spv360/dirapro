import { formatJourneyDate, mediaUrl, type JourneyItem } from "../data/journey";
import type { CurrentMoment } from "../data/profile";

/**
 * Builds the Current Moment carousel from the static base moments plus Journey
 * items that reference it. Journey content is read live, never copied.
 */
export function withJourneyMoments(base: CurrentMoment, journey: JourneyItem[]): CurrentMoment {
  const referenced = journey
    .filter((item) => item.currentMomentReference && item.media?.kind === "image")
    .sort((a, b) =>
      (b.currentMomentReference?.featuredAt ?? "").localeCompare(a.currentMomentReference?.featuredAt ?? ""),
    );

  if (!referenced.length) return base;

  return {
    updated: formatJourneyDate(referenced[0].date),
    moments: [
      ...referenced.map((item) => ({
        mediaType: "image" as const,
        type: item.type,
        title: item.title,
        date: formatJourneyDate(item.date),
        image: mediaUrl(item.media!),
        imageAlt: item.media!.alt || item.title,
        organization: item.organization || undefined,
        summary: item.description,
        focus: item.tags,
      })),
      ...base.moments,
    ],
  };
}
