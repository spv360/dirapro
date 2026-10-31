export const PUBLISHING_DISABLED_CODE = "PUBLISHING_DISABLED";
export const PUBLISHING_DISABLED_MESSAGE =
  "Publishing is temporarily unavailable while Dira moves to production storage. Your profile remains live and nothing was changed.";

type Env = Record<string, string | undefined>;

/**
 * Journey persistence is file-backed, which is not durable on serverless hosts.
 * Writes are therefore refused on Vercel (or when explicitly disabled) regardless
 * of any other configuration. Local development is unaffected.
 */
export function publishingDisabled(env: Env = process.env): boolean {
  return Boolean(env.VERCEL) || env.DIRA_PUBLISHING_DISABLED === "true";
}

export function publishingDisabledResponse(): Response {
  return Response.json(
    { code: PUBLISHING_DISABLED_CODE, error: PUBLISHING_DISABLED_MESSAGE },
    { status: 503 },
  );
}
