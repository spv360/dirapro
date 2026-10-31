import { validateJourneyInput } from "../../data/journey";
import { createItem, listAll } from "../../lib/journey-store";
import { guardOwner, ownedProfileId } from "../../lib/owner-auth";

export async function GET(request: Request) {
  const denied = await guardOwner(request);
  if (denied) return denied;

  return Response.json({ items: await listAll(ownedProfileId) });
}

export async function POST(request: Request) {
  const denied = await guardOwner(request);
  if (denied) return denied;

  const result = validateJourneyInput(await request.json().catch(() => null));
  if (!result.ok) return Response.json({ errors: result.errors }, { status: 422 });

  try {
    return Response.json({ item: await createItem(ownedProfileId, result.value) }, { status: 201 });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 409 });
  }
}
