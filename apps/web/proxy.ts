import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { accountWritesDisabled } from "./app/lib/publishing";
import { supabaseCookieOptions, supabasePublicConfig } from "./app/lib/platform/supabase/config";

export async function proxy(request: NextRequest) {
  if (process.env.DIRA_BACKEND !== "supabase" || accountWritesDisabled()) {
    return NextResponse.next({ request });
  }

  const { url, key } = supabasePublicConfig();
  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookieOptions: supabaseCookieOptions,
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(values, headers) {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        values.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, { ...options, ...supabaseCookieOptions }),
        );
        Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
      },
    },
  });

  await supabase.auth.getClaims();
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
