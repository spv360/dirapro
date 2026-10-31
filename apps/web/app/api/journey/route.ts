import { validateJourneyInput } from "../../data/journey";
import { createItem, listAll } from "../../lib/journey-store";
import { authorizeOwner } from "../../lib/owner-auth";

export async function GET(request: Request) {
  const auth = await authorizeOwner(request);
  if (auth instanceof Response) return auth;

  return Response.json({ items: await listAll(auth.profileId) });
}

export async function POST(request: Request) {
  const auth = await authorizeOwner(request);
  if (auth instanceof Response) return auth;

  const result = validateJourneyInput(await request.json().catch(() => null));
  if (!result.ok) return Response.json({ errors: result.errors }, { status: 422 });

  try {
    return Response.json({ item: await createItem(auth.profileId, result.value) }, { status: 201 });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 409 });
  }
}
