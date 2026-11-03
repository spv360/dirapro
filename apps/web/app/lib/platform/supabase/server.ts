import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseCookieOptions, supabasePublicConfig } from "./config";

export async function createSupabaseServerClient(options: { requireWritableCookies?: boolean } = {}) {
  const { url, key } = supabasePublicConfig();
  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookieOptions: supabaseCookieOptions,
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(values) {
        try {
          values.forEach(({ name, value, options: cookie }) =>
            cookieStore.set(name, value, { ...cookie, ...supabaseCookieOptions }),
          );
        } catch (error) {
          if (options.requireWritableCookies) throw error;
        }
      },
    },
  });
}

export type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;
