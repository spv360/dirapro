import { randomUUID } from "node:crypto";
import { MEDIA_RULES, mediaKindFor, type JourneyMedia } from "../../../data/journey";
import { saveUpload } from "../../../lib/journey-store";
import { guardOwner } from "../../../lib/owner-auth";

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/webm": "webm",
};

// Confirms the bytes match the declared type so a renamed file cannot slip through.
function matchesSignature(mimeType: string, bytes: Buffer): boolean {
  switch (mimeType) {
    case "image/jpeg":
      return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    case "image/png":
      return bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    case "image/webp":
      return bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP";
    case "video/mp4":
      return bytes.subarray(4, 8).toString("ascii") === "ftyp";
    case "video/webm":
      return bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3;
    default:
      return false;
  }
}

export async function POST(request: Request) {
  const denied = await guardOwner(request);
  if (denied) return denied;

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
