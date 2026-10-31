import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { canPublish, profileCompletion, validateAbout, validateList, validatePassword, validateRegistration, validateUsername } from "../app/lib/platform/validation.ts";
import { toDiraProfile } from "../app/lib/platform/to-profile.ts";
import type { ProfileAggregate } from "../app/lib/platform/types.ts";

const valid = { fullName: "Dr Asha Rao", email: "Asha@Example.com", username: "asha-rao", password: "correct-horse-9", terms: true };

describe("registration validation", () => {
  test("accepts a valid registration and normalises email", () => {
    const result = validateRegistration(valid);
    assert.ok(result.ok);
    if (result.ok) assert.equal(result.value.email, "asha@example.com");
  });
  test("requires terms, a strong password and a valid email", () => {
    const result = validateRegistration({ ...valid, terms: false, password: "short", email: "nope" });
    assert.ok(!result.ok);
    if (!result.ok) assert.deepEqual(Object.keys(result.errors).sort(), ["email", "password", "terms"]);
  });
  test("rejects passwords containing the username", () => {
    assert.ok(!validateRegistration({ ...valid, password: "asha-rao12345" }).ok);
  });
});

describe("username and password rules", () => {
  test("reserved, malformed and short usernames are rejected", () => {
    for (const bad of ["alex-morgan", "admin", "login", "ab", "Has Space", "-lead", "trail-", "a--b", "x".repeat(31)]) {
      assert.ok(validateUsername(bad), bad);
    }
    assert.equal(validateUsername("asha-rao"), null);
  });
  test("passwords need length, a letter and a number", () => {
    assert.ok(validatePassword("abcdefghij"));
    assert.ok(validatePassword("1234567890"));
    assert.equal(validatePassword("abcdefghi1"), null);
  });
});

describe("section validation", () => {
  test("rejects unsafe URLs and bad dates", () => {
    const result = validateList("presence", [{ platform: "Website", label: "x", url: "javascript:alert(1)" }]);
    assert.ok(!result.ok);
    const exp = validateList("experience", [{ title: "A", organization: "B", startDate: "2022-05", endDate: "2021-01" }]);
    assert.ok(!exp.ok);
  });
  test("drops end date for current roles and ignores unknown media", () => {
    const result = validateList("experience", [{ title: "A", organization: "B", startDate: "2022-05", endDate: "2023-01", current: true }]);
    assert.ok(result.ok);
    if (result.ok) assert.equal(result.value[0].endDate, "");
    assert.ok(!validateList("contributions", [{ title: "T", media: { file: "../../etc/passwd", mimeType: "image/png", size: 1 } }]).ok);
  });
  test("caps list length and trims interests", () => {
    assert.ok(!validateList("expertise", Array.from({ length: 41 }, () => ({ name: "x" }))).ok);
    const about = validateAbout({ biography: " hi ", interests: [" a ", "a", ""] });
    assert.ok(about.ok);
    if (about.ok) assert.deepEqual(about.value.interests, ["a"]);
  });
});

describe("completion and mapping", () => {
  const empty: ProfileAggregate = {
    profile: { id: "p", ownerId: "o", username: "asha-rao", fullName: "Asha Rao", headline: "", biography: "", knownFor: "", interests: [], careerFocus: "", location: "", profileImage: null, coverImage: null, status: "draft", onboardingStep: 0, createdAt: "", updatedAt: "", publishedAt: null },
    expertise: [], experience: [], education: [], recognition: [], contributions: [], links: [],
  };
  test("a new profile cannot publish and is 0% complete", () => {
    assert.equal(canPublish(empty), false);
    assert.equal(profileCompletion(empty).percent, 0);
  });
  test("maps an empty profile without sections that would crash renderers", () => {
    const mapped = toDiraProfile({ ...empty, profile: { ...empty.profile, headline: "Cardiologist" } });
    assert.equal(mapped.identity.initials, "AR");
    assert.equal(mapped.publicMoments.length + mapped.knowledge.length + mapped.media.length, 0);
    assert.equal(mapped.evidence.length, 0);
  });
});
