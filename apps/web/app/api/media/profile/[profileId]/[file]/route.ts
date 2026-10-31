import { mediaStorage, profiles } from "../../../../../lib/platform";
import { currentUser } from "../../../../../lib/platform/session";
import type { ProfileAggregate } from "../../../../../lib/platform/types";
import { MIME_BY_EXT, isProfileMediaFile, isUuid } from "../../../../../lib/platform/validation";

type Context = { params: Promise<{ profileId: string; file: string }> };

const references = (agg: ProfileAggregate, file: string) =>
  agg.profile.profileImage?.file === file ||
  agg.profile.coverImage?.file === file ||
  agg.contributions.some((c) => c.media?.file === file);

export async function GET(_request: Request, { params }: Context) {
  const { profileId, file } = await params;
  const notFound = () => new Response("Not found", { status: 404 });
  if (!isUuid(profileId) || !isProfileMediaFile(file)) return notFound();

  const agg = await profiles.getById(profileId);
  if (!agg) return notFound();

  // Public only when the profile is published and the file is actually part of it.
  const isPublic = agg.profile.status === "published" && references(agg, file);
  if (!isPublic) {
    const user = await currentUser();
    if (!user || user.id !== agg.profile.ownerId) return notFound();
  }

  const bytes = await mediaStorage.read(profileId, file);
  if (!bytes) return notFound();

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": MIME_BY_EXT[file.split(".").pop() ?? ""],
      "Content-Length": String(bytes.length),
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": isPublic ? "public, max-age=300" : "private, no-store",
    },
  });
}
