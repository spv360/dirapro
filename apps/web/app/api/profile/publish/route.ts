import { profiles } from "../../../lib/platform";
import { authorizeApi } from "../../../lib/platform/session";

export async function POST(request: Request) {
  const gate = await authorizeApi(request);
  if (gate instanceof Response) return gate;

  const body = (await request.json().catch(() => null)) as { published?: unknown } | null;
  if (typeof body?.published !== "boolean") {
    return Response.json({ error: "Expected { published: boolean }." }, { status: 400 });
  }

  const result = await profiles.setPublished(gate.user!.id, body.published);
  if (!result.ok) return Response.json({ code: result.code, error: result.message }, { status: 422 });
  return Response.json({ status: result.value.profile.status, publishedAt: result.value.profile.publishedAt });
}
