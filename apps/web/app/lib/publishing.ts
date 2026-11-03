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

/**
 * Account and profile writes use Supabase (never the filesystem) on Vercel Preview.
 * Production additionally requires the explicit DIRA_ENABLE_ACCOUNT_WRITES=true flag.
 * Everything else on Vercel stays disabled. Fails closed when the backend or its
 * public configuration is missing.
 */
export function accountWritesDisabled(env: Env = process.env): boolean {
  if (env.DIRA_PUBLISHING_DISABLED === "true") return true;
  if (!env.VERCEL) return false;
  const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const environmentAllowed =
    env.VERCEL_ENV === "preview" ||
    (env.VERCEL_ENV === "production" && env.DIRA_ENABLE_ACCOUNT_WRITES === "true");
  return !(
    environmentAllowed &&
    env.DIRA_BACKEND === "supabase" &&
    isValidSupabaseUrl(env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(key?.trim())
  );
}

function isValidSupabaseUrl(value: string | undefined): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname !== "" && url.username === "" && url.password === "";
  } catch {
    return false;
  }
}
