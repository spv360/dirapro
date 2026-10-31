import { promises as fs } from "node:fs";
import path from "node:path";
import { isValidMediaFile } from "../../../../data/journey";
import { findByMediaFile, isPublic, uploadsDir } from "../../../../lib/journey-store";
import { resolveOwnerProfileId } from "../../../../lib/owner-auth";
import { demoProfile } from "../../../../data/profile";
import { profiles } from "../../../../lib/platform";

const TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  mp4: "video/mp4",
  webm: "video/webm",
};

type Context = { params: Promise<{ file: string }> };

export async function GET(request: Request, { params }: Context) {
  const { file } = await params;
  if (!isValidMediaFile(file)) return new Response("Not found", { status: 404 });

  // Media of drafts, archived and private updates (and unattached uploads) is owner-only.
  const item = await findByMediaFile(file);
  // Public only when the item is published+public AND its profile is itself live.
  let visible = item ? isPublic(item) : false;
  if (item && visible && item.profileId !== demoProfile.username) {
    visible = (await profiles.getById(item.profileId))?.profile.status === "published";
  }
  if (!visible) {
    const owner = await resolveOwnerProfileId();
    // Items belong to one profile; unattached uploads are visible to any signed-in owner.
    if (!owner || (item && item.profileId !== owner)) {
      return new Response("Not found", { status: 404 });
    }
  }

  const fullPath = path.join(uploadsDir(), file);
  let size: number;
  try {
    size = (await fs.stat(fullPath)).size;
  } catch {
    return new Response("Not found", { status: 404 });
  }

  const headers: Record<string, string> = {
    "Content-Type": TYPES[file.split(".").pop() ?? ""],
    "Accept-Ranges": "bytes",
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": visible ? "public, max-age=300" : "private, no-store",
  };

  // Range support so video can seek and play in Safari.
  const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get("range") ?? "");
  let start = 0;
  let end = size - 1;
  if (range && (range[1] || range[2])) {
    if (range[1]) {
      start = Number(range[1]);
      if (range[2]) end = Math.min(Number(range[2]), size - 1);
    } else {
      start = Math.max(size - Number(range[2]), 0);
    }
    if (start > end || start >= size) {
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    }
  }

  const handle = await fs.open(fullPath, "r");
  const length = end - start + 1;
  const buffer = Buffer.alloc(length);
  await handle.read(buffer, 0, length, start);
  await handle.close();

  headers["Content-Length"] = String(length);
  if (range) {
    headers["Content-Range"] = `bytes ${start}-${end}/${size}`;
    return new Response(buffer, { status: 206, headers });
  }
  return new Response(buffer, { headers });
}
