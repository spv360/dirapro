type ConfirmationError = { message: string } | null;

export type ConfirmationClient = {
  auth: {
    verifyOtp(input: { token_hash: string; type: "signup" }): Promise<{ error: ConfirmationError }>;
    exchangeCodeForSession(code: string): Promise<{ error: ConfirmationError }>;
    setSession(input: { access_token: string; refresh_token: string }): Promise<{ error: ConfirmationError }>;
  };
};

type ConfirmationDependencies = {
  accountsDisabled(): boolean;
  createClient(requireWritableCookies: boolean): Promise<ConfirmationClient>;
};

const noStore = { "Cache-Control": "private, no-store" };

export function safeConfirmationDestination(request: Request, candidate: string | null): string {
  const fallback = "/onboarding";
  if (!candidate || candidate.length > 2048 || !candidate.startsWith("/") || candidate.startsWith("//") || candidate.includes("\\")) {
    return fallback;
  }
  try {
    const base = new URL(request.url);
    const target = new URL(candidate, base);
    if (target.origin !== base.origin || !["http:", "https:"].includes(target.protocol)) return fallback;
    return `${target.pathname}${target.search}`;
  } catch {
    return fallback;
  }
}

function redirect(request: Request, path: string): Response {
  return new Response(null, {
    status: 303,
    headers: { Location: new URL(path, request.url).toString(), ...noStore },
  });
}

function confirmationPage(): Response {
  const html = `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Confirming email · DiraPro</title></head>
  <body><main><p id="status" role="status">Confirming your email…</p></main>
    <script>
      (() => {
        const status = document.getElementById("status");
        const params = new URLSearchParams(location.hash.slice(1));
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");
        const next = new URL(location.href).searchParams.get("next");
        history.replaceState(null, "", location.pathname + location.search);
        if (!accessToken || !refreshToken) {
          status.textContent = "This confirmation link is invalid or has expired.";
          return;
        }
        fetch("/auth/confirm", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ access_token: accessToken, refresh_token: refreshToken, next })
        }).then(async (response) => {
          const result = await response.json();
          if (!response.ok || typeof result.redirectTo !== "string") throw new Error("Confirmation failed");
          location.replace(result.redirectTo);
        }).catch(() => {
          status.textContent = "We could not confirm your email. The link may have expired; please try signing in or register again.";
        });
      })();
    </script>
  </body>
</html>`;
  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      ...noStore,
    },
  });
}

export function createConfirmationHandlers(dependencies: ConfirmationDependencies) {
  return {
    async GET(request: Request): Promise<Response> {
      if (dependencies.accountsDisabled()) return redirect(request, "/login?verification=unavailable");

      const url = new URL(request.url);
      if (url.searchParams.has("error") || url.searchParams.has("error_description")) {
        return redirect(request, "/login?verification=failed");
      }

      const destination = safeConfirmationDestination(
        request,
        url.searchParams.get("next") ?? url.searchParams.get("redirect_to"),
      );
      const tokenHash = url.searchParams.get("token_hash");
      const type = url.searchParams.get("type");
      const code = url.searchParams.get("code");
      if (!tokenHash && !code) return confirmationPage();
      if (tokenHash && type !== "signup") return redirect(request, "/login?verification=failed");

      const supabase = await dependencies.createClient(true);
      const { error } = tokenHash
        ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "signup" })
        : await supabase.auth.exchangeCodeForSession(code!);
      return redirect(request, error ? "/login?verification=failed" : destination);
    },

    async POST(request: Request): Promise<Response> {
      if (dependencies.accountsDisabled()) {
        return Response.json(
          { error: "Accounts are not available in this environment." },
          { status: 503, headers: noStore },
        );
      }

      const origin = request.headers.get("origin");
      const host = request.headers.get("host");
      let sameOrigin = false;
      try {
        const requestOrigin = new URL(request.url).origin;
        sameOrigin = Boolean(
          origin &&
          host &&
          new URL(origin).origin === requestOrigin &&
          new URL(origin).host === host,
        );
      } catch {
        sameOrigin = false;
      }
      if (!sameOrigin) {
        return Response.json({ error: "Cross-origin request rejected." }, { status: 403, headers: noStore });
      }

      const body: unknown = await request.json().catch(() => null);
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        return Response.json({ error: "Invalid confirmation request." }, { status: 400, headers: noStore });
      }
      const payload = body as Record<string, unknown>;
      const accessToken = payload.access_token;
      const refreshToken = payload.refresh_token;
      if (
        typeof accessToken !== "string" ||
        typeof refreshToken !== "string" ||
        accessToken.length < 1 ||
        refreshToken.length < 1 ||
        accessToken.length > 8192 ||
        refreshToken.length > 8192
      ) {
        return Response.json({ error: "Invalid confirmation session." }, { status: 400, headers: noStore });
      }

      const supabase = await dependencies.createClient(true);
      const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      if (error) {
        return Response.json({ error: "This confirmation link is invalid or has expired." }, { status: 400, headers: noStore });
      }
      const destination = safeConfirmationDestination(
        request,
        typeof payload.next === "string" ? payload.next : null,
      );
      return Response.json({ redirectTo: destination }, { headers: noStore });
    },
  };
}
