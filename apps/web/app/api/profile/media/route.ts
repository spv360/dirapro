import { mediaStorage, profiles } from "../../../lib/platform";
import { matchesSignature } from "../../../lib/media-signature";
import { authorizeApi } from "../../../lib/platform/session";
import { validateImageFile } from "../../../lib/platform/validation";

export async function POST(request: Request) {
  const gate = await authorizeApi(request);
  if (gate instanceof Response) return gate;

  const agg = await profiles.getByOwner(gate.user!.id);
  if (!agg) return Response.json({ error: "Profile not found." }, { status: 404 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return Response.json({ error: "No file was provided." }, { status: 400 });

  const problem = validateImageFile(file);
  if (problem) return Response.json({ error: problem }, { status: file.size > 8 * 1024 * 1024 ? 413 : 415 });

  const bytes = Buffer.from(await file.arrayBuffer());
  if (!matchesSignature(file.type, bytes)) {
    return Response.json({ error: "The file contents do not match its type." }, { status: 415 });
  }

  const media = await mediaStorage.save(agg.profile.id, bytes, file.type);
  return Response.json({ media, url: `/api/media/profile/${agg.profile.id}/${media.file}` }, { status: 201 });
}
