import { randomUUID } from "node:crypto";
import { MEDIA_RULES, mediaKindFor, type JourneyMedia } from "../../../data/journey";
import { saveUpload } from "../../../lib/journey-store";
import { authorizeOwner } from "../../../lib/owner-auth";
import { matchesSignature } from "../../../lib/media-signature";

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/webm": "webm",
};

export async function POST(request: Request) {
  const auth = await authorizeOwner(request);
  if (auth instanceof Response) return auth;

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "No file was provided." }, { status: 400 });
  }

  const kind = mediaKindFor(file.type);
  if (!kind) {
    return Response.json({ error: "Unsupported file type. Use JPEG, PNG or WebP images, or MP4 / WebM video." }, { status: 415 });
  }
  if (file.size <= 0 || file.size > MEDIA_RULES[kind].maxBytes) {
    return Response.json({ error: `${kind === "image" ? "Images" : "Videos"} must be under ${MEDIA_RULES[kind].maxBytes / 1024 / 1024} MB.` }, { status: 413 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (!matchesSignature(file.type, bytes)) {
    return Response.json({ error: "The file contents do not match its type." }, { status: 415 });
  }

  const name = `${randomUUID()}.${EXTENSIONS[file.type]}`;
  await saveUpload(name, bytes);

  const media: JourneyMedia = { kind, file: name, mimeType: file.type, size: file.size };
  return Response.json({ media }, { status: 201 });
}
