import {
  CONTRIBUTION_TYPES,
  EXPERTISE_CATEGORIES,
  LINK_PLATFORMS,
  RECOGNITION_KINDS,
  type AboutInput,
  type IdentityInput,
  type ListSection,
  type MediaRef,
  type ProfileAggregate,
  type SectionItems,
} from "./types.ts";

export type Errors = Record<string, string>;
export type Validated<T> = { ok: true; value: T } | { ok: false; errors: Errors };

export const RESERVED_USERNAMES = new Set([
  "admin", "administrator", "api", "app", "about", "account", "auth", "billing", "blog", "contact",
  "dashboard", "dira", "dirapro", "help", "home", "login", "logout", "me", "new", "onboarding",
  "privacy", "profile", "profiles", "register", "root", "settings", "share", "signin", "signup",
  "static", "support", "system", "terms", "user", "users", "www", "alex-morgan",
]);

const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MEDIA_FILE_PATTERN = /^[a-f0-9-]{36}\.(jpg|png|webp)$/;
const UUID_PATTERN = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;

export const MIME_BY_EXT: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

export const isUuid = (value: string) => UUID_PATTERN.test(value);
export const isProfileMediaFile = (value: string) => MEDIA_FILE_PATTERN.test(value);

export const PROFILE_IMAGE_RULES = {
  mimeTypes: ["image/jpeg", "image/png", "image/webp"],
  maxBytes: 8 * 1024 * 1024,
} as const;

export function validateImageFile(file: { type: string; size: number }): string | null {
  if (!(PROFILE_IMAGE_RULES.mimeTypes as readonly string[]).includes(file.type)) {
    return "Use a JPEG, PNG or WebP image.";
  }
  if (file.size <= 0) return "This file is empty.";
  if (file.size > PROFILE_IMAGE_RULES.maxBytes) return "Images must be under 8 MB.";
  return null;
}

export function validateUsername(value: string): string | null {
  if (value.length < 3 || value.length > 30) return "Use 3–30 characters.";
  if (!USERNAME_PATTERN.test(value)) return "Use lowercase letters, numbers and hyphens only.";
  if (value.includes("--")) return "Avoid consecutive hyphens.";
  if (RESERVED_USERNAMES.has(value)) return "This username is reserved.";
  return null;
}

export function validatePassword(value: string): string | null {
  if (value.length < 10) return "Use at least 10 characters.";
  if (value.length > 128) return "Use 128 characters or fewer.";
  if (!/[a-zA-Z]/.test(value) || !/[0-9]/.test(value)) return "Include at least one letter and one number.";
  return null;
}

export function validateEmail(value: string): string | null {
  if (value.length > 254 || !EMAIL_PATTERN.test(value)) return "Enter a valid email address.";
  return null;
}

export type RegistrationInput = {
  fullName: string;
  email: string;
  username: string;
  password: string;
};

const str = (value: unknown, max: number) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

const obj = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

export function validateRegistration(raw: unknown): Validated<RegistrationInput> {
  const body = obj(raw);
  const errors: Errors = {};
  const fullName = str(body.fullName, 120);
  const email = str(body.email, 254).toLowerCase();
  const username = str(body.username, 60).toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";

  if (!fullName) errors.fullName = "Enter your full name.";
  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;
  const usernameError = validateUsername(username);
  if (usernameError) errors.username = usernameError;
  const passwordError = validatePassword(password);
  if (passwordError) errors.password = passwordError;
  else if (password.toLowerCase().includes(username) && username.length >= 5) {
    errors.password = "Do not include your username in your password.";
  }
  if (body.terms !== true) errors.terms = "Accept the terms to continue.";

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value: { fullName, email, username, password } };
}

function validUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function media(value: unknown, errors: Errors, key: string): MediaRef | null {
  if (!value) return null;
  const m = obj(value);
  if (
    typeof m.file === "string" && MEDIA_FILE_PATTERN.test(m.file) &&
    typeof m.mimeType === "string" && (PROFILE_IMAGE_RULES.mimeTypes as readonly string[]).includes(m.mimeType) &&
    typeof m.size === "number" && m.size > 0 && m.size <= PROFILE_IMAGE_RULES.maxBytes
  ) {
    return { file: m.file, mimeType: m.mimeType, size: m.size };
  }
  errors[key] = "Invalid image.";
  return null;
}

export function validateIdentity(raw: unknown): Validated<IdentityInput> {
  const body = obj(raw);
  const errors: Errors = {};
  const fullName = str(body.fullName, 120);
  const username = str(body.username, 60).toLowerCase();
  if (!fullName) errors.fullName = "Enter your full name.";
  const usernameError = validateUsername(username);
  if (usernameError) errors.username = usernameError;
  const value: IdentityInput = {
    fullName,
    headline: str(body.headline, 160),
    username,
    location: str(body.location, 120),
    profileImage: media(body.profileImage, errors, "profileImage"),
    coverImage: media(body.coverImage, errors, "coverImage"),
  };
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value };
}

export function validateAbout(raw: unknown): Validated<AboutInput> {
  const body = obj(raw);
  const errors: Errors = {};
  const biography = str(body.biography, 4000);
  const interests = (Array.isArray(body.interests) ? body.interests : [])
    .map((item) => str(item, 60))
    .filter(Boolean);
  if (interests.length > 20) errors.interests = "Use at most 20 interests.";
  return Object.keys(errors).length
    ? { ok: false, errors }
    : { ok: true, value: { biography, knownFor: str(body.knownFor, 300), interests: Array.from(new Set(interests)), careerFocus: str(body.careerFocus, 300) } };
}

const MAX_ITEMS = 40;
const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const YEAR = /^\d{4}$/;
const oneOf = <T extends string>(list: readonly T[], value: unknown): value is T =>
  typeof value === "string" && (list as readonly string[]).includes(value);

function itemId(value: unknown): string | undefined {
  return typeof value === "string" && isUuid(value) ? value : undefined;
}

function optionalUrl(value: unknown, errors: Errors, key: string): string {
  const url = str(value, 500);
  if (url && !validUrl(url)) errors[key] = "Enter a valid http(s) URL.";
  return url;
}

export function validateList<S extends ListSection>(section: S, raw: unknown): Validated<SectionItems[S]> {
  const errors: Errors = {};
  const list = Array.isArray(raw) ? raw : null;
  if (!list) return { ok: false, errors: { items: "Expected a list." } };
  if (list.length > MAX_ITEMS) return { ok: false, errors: { items: `Use at most ${MAX_ITEMS} entries.` } };

  const out: unknown[] = list.map((entry, index) => {
    const e = obj(entry);
    const at = (field: string) => `${index}.${field}`;
    const id = itemId(e.id);

    switch (section) {
      case "expertise": {
        const name = str(e.name, 80);
        if (!name) errors[at("name")] = "Enter a name.";
        const category = oneOf(EXPERTISE_CATEGORIES, e.category) ? e.category : "expertise";
        return { id, name, category };
      }
      case "experience": {
        const current = e.current === true;
        const startDate = str(e.startDate, 7);
        const endDate = current ? "" : str(e.endDate, 7);
        const title = str(e.title, 120);
        const organization = str(e.organization, 120);
        if (!title) errors[at("title")] = "Enter a job title.";
        if (!organization) errors[at("organization")] = "Enter an organization.";
        if (startDate && !MONTH.test(startDate)) errors[at("startDate")] = "Use a valid month.";
        if (endDate && !MONTH.test(endDate)) errors[at("endDate")] = "Use a valid month.";
        if (startDate && endDate && endDate < startDate) errors[at("endDate")] = "End must be after start.";
        return { id, organization, title, employmentType: str(e.employmentType, 40), location: str(e.location, 120), startDate, endDate, current, description: str(e.description, 2000) };
      }
      case "education": {
        const institution = str(e.institution, 160);
        const startDate = str(e.startDate, 4);
        const endDate = str(e.endDate, 4);
        if (!institution) errors[at("institution")] = "Enter an institution.";
        if (startDate && !YEAR.test(startDate)) errors[at("startDate")] = "Use a 4-digit year.";
        if (endDate && !YEAR.test(endDate)) errors[at("endDate")] = "Use a 4-digit year.";
        if (startDate && endDate && endDate < startDate) errors[at("endDate")] = "End must be after start.";
        return { id, institution, qualification: str(e.qualification, 160), fieldOfStudy: str(e.fieldOfStudy, 160), startDate, endDate, description: str(e.description, 2000) };
      }
      case "recognition": {
        const title = str(e.title, 160);
        const issueDate = str(e.issueDate, 7);
        if (!title) errors[at("title")] = "Enter a title.";
        if (issueDate && !MONTH.test(issueDate)) errors[at("issueDate")] = "Use a valid month.";
        return {
          id, title, issueDate,
          kind: oneOf(RECOGNITION_KINDS, e.kind) ? e.kind : "recognition",
          issuer: str(e.issuer, 160),
          credentialUrl: optionalUrl(e.credentialUrl, errors, at("credentialUrl")),
          description: str(e.description, 1000),
        };
      }
      case "contributions": {
        const title = str(e.title, 160);
        if (!title) errors[at("title")] = "Enter a title.";
        return {
          id, title,
          type: oneOf(CONTRIBUTION_TYPES, e.type) ? e.type : "project",
          description: str(e.description, 2000),
          url: optionalUrl(e.url, errors, at("url")),
          media: media(e.media, errors, at("media")),
        };
      }
      case "presence": {
        const url = str(e.url, 500);
        if (!url || !validUrl(url)) errors[at("url")] = "Enter a valid http(s) URL.";
        return { id, platform: oneOf(LINK_PLATFORMS, e.platform) ? e.platform : "Other", label: str(e.label, 80), url };
      }
    }
  });

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value: out as SectionItems[S] };
}

/** Weighted completion used by the dashboard indicator. */
export function profileCompletion(agg: ProfileAggregate): { percent: number; missing: string[] } {
  const p = agg.profile;
  const parts: [string, number, boolean][] = [
    ["Identity", 20, Boolean(p.fullName && p.headline && p.location)],
    ["Profile photograph", 10, Boolean(p.profileImage)],
    ["About", 15, Boolean(p.biography)],
    ["Expertise", 15, agg.expertise.length > 0],
    ["Experience", 15, agg.experience.length > 0],
    ["Education", 5, agg.education.length > 0],
    ["Recognition", 5, agg.recognition.length > 0],
    ["Contributions", 5, agg.contributions.length > 0],
    ["Public presence", 10, agg.links.length > 0],
  ];
  return {
    percent: parts.reduce((sum, [, weight, done]) => sum + (done ? weight : 0), 0),
    missing: parts.filter(([, , done]) => !done).map(([label]) => label),
  };
}

export const canPublish = (agg: ProfileAggregate) => Boolean(agg.profile.fullName && agg.profile.headline);
