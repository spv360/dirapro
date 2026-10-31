import { createHash, randomBytes, randomUUID, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { validateUsername } from "../validation";
import type { Profile, PublicUser } from "../types";
import type { AuthResult, AuthService } from "../ports";
import { readDb, transact } from "./store";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${key.toString("hex")}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, saltHex, keyHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !keyHex) return false;
  const expected = Buffer.from(keyHex, "hex");
  const actual = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

// Compared against when the account does not exist, so timing does not reveal it.
const dummyHash = hashPassword("dira-dummy-password-1");

const ttlMs = () => (Number(process.env.DIRA_SESSION_TTL_SECONDS) || 7 * 24 * 3600) * 1000;
const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");
const publicUser = (u: { id: string; email: string }): PublicUser => ({ id: u.id, email: u.email });

// Per-identifier throttling (in memory; Supabase Auth provides this in production).
const failures = new Map<string, { count: number; until: number }>();
const MAX_FAILS = 5;
const LOCK_MS = 60_000;

function locked(key: string) {
  const f = failures.get(key);
  return Boolean(f && f.count >= MAX_FAILS && f.until > Date.now());
}
function fail(key: string) {
  const f = failures.get(key);
  const fresh = !f || f.until <= Date.now();
  failures.set(key, { count: fresh ? 1 : f.count + 1, until: Date.now() + LOCK_MS });
}

const bad = (code: string, message: string): AuthResult<never> => ({ ok: false, code, message });

export const localAuth: AuthService = {
  async register(input) {
    const passwordHash = await hashPassword(input.password);
    const token = randomBytes(32).toString("base64url");
    return transact<AuthResult<{ user: PublicUser; profileId: string; token: string }>>((db) => {
      if (db.users.some((u) => u.email === input.email)) {
        return { result: bad("EMAIL_TAKEN", "An account with this email already exists."), save: false };
      }
      if (db.profiles.some((p) => p.profile.username === input.username)) {
        return { result: bad("USERNAME_TAKEN", "This username is already taken."), save: false };
      }
      const now = new Date().toISOString();
      const user = { id: randomUUID(), email: input.email, passwordHash, createdAt: now, updatedAt: now };
      const profile: Profile = {
        id: randomUUID(), ownerId: user.id, username: input.username, fullName: input.fullName,
        headline: "", biography: "", knownFor: "", interests: [], careerFocus: "", location: "",
        profileImage: null, coverImage: null, status: "draft", onboardingStep: 0,
        createdAt: now, updatedAt: now, publishedAt: null,
      };
      db.users.push(user);
      db.profiles.push({ profile, expertise: [], experience: [], education: [], recognition: [], contributions: [], links: [] });
      db.sessions.push({ hash: tokenHash(token), userId: user.id, expiresAt: Date.now() + ttlMs() });
      return { result: { ok: true, value: { user: publicUser(user), profileId: profile.id, token } }, save: true };
    });
  },

  async login(identifier, password) {
    const key = identifier.toLowerCase();
    if (locked(key)) return bad("RATE_LIMITED", "Too many attempts. Try again in a minute.");
    const db = await readDb();
    const profile = db.profiles.find((p) => p.profile.username === key);
    const user = db.users.find((u) => u.email === key) ?? (profile ? db.users.find((u) => u.id === profile.profile.ownerId) : undefined);
    const ok = await verifyPassword(password, user ? user.passwordHash : await dummyHash);
    if (!user || !ok) {
      fail(key);
      return bad("INVALID_CREDENTIALS", "Incorrect email, username or password.");
    }
    failures.delete(key);
    const token = randomBytes(32).toString("base64url");
    await transact((d) => {
      const now = Date.now();
      d.sessions = d.sessions.filter((s) => s.expiresAt > now);
      d.sessions.push({ hash: tokenHash(token), userId: user.id, expiresAt: now + ttlMs() });
      return { result: undefined, save: true };
    });
    return { ok: true, value: { user: publicUser(user), token } };
  },

  async userForToken(token) {
    if (!token) return null;
    const hash = tokenHash(token);
    const db = await readDb();
    const session = db.sessions.find((s) => s.hash === hash);
    if (!session || session.expiresAt <= Date.now()) return null;
    const user = db.users.find((u) => u.id === session.userId);
    return user ? publicUser(user) : null;
  },

  async logout(token) {
    if (!token) return;
    const hash = tokenHash(token);
    await transact((db) => {
      db.sessions = db.sessions.filter((s) => s.hash !== hash);
      return { result: undefined, save: true };
    });
  },

  async usernameAvailable(username) {
    if (validateUsername(username)) return false;
    const db = await readDb();
    return !db.profiles.some((p) => p.profile.username === username);
  },
};
