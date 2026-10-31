import type { ProfileAggregate } from "../../lib/platform/types";

export type ProfileView = ProfileAggregate & { completion: { percent: number; missing: string[] } };
export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; message: string; errors: Record<string, string> };

export async function call<T>(url: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const response = await fetch(url, init);
    const body = await response.json().catch(() => ({}));
    if (response.ok) return { ok: true, data: body as T };
    return {
      ok: false,
      status: response.status,
      message: typeof body.error === "string" ? body.error : "Something went wrong. Please try again.",
      errors: body.errors && typeof body.errors === "object" ? body.errors : {},
    };
  } catch {
    return { ok: false, status: 0, message: "Network error. Check your connection and try again.", errors: {} };
  }
}

export const postJson = <T,>(url: string, method: string, body: unknown) =>
  call<T>(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

export const saveSection = (section: string, data: unknown, step?: number) =>
  postJson<{ profile: ProfileView }>("/api/profile", "PATCH", { section, data, step });
