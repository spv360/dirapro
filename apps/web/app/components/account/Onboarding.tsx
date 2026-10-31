"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import PublicProfileView from "../profile/PublicProfileView";
import { toDiraProfile } from "../../lib/platform/to-profile";
import { postJson, type ProfileView } from "./api";
import SectionEditor, { type EditorSection } from "./SectionEditors";

type Step = { id: EditorSection | "preview"; title: string; blurb: string; optional?: boolean };

export const STEPS: Step[] = [
  { id: "identity", title: "Identity", blurb: "Who you are, and how people will find you." },
  { id: "about", title: "About", blurb: "Your story in your own words." },
  { id: "expertise", title: "Expertise", blurb: "Areas, skills and domains you're known for." },
  { id: "experience", title: "Experience", blurb: "Roles and appointments.", optional: true },
  { id: "education", title: "Education", blurb: "Qualifications and institutions.", optional: true },
  { id: "recognition", title: "Recognition", blurb: "Certifications, awards and honours.", optional: true },
  { id: "contributions", title: "Contributions", blurb: "Projects, publications and work you're proud of.", optional: true },
  { id: "presence", title: "Public presence", blurb: "Official places people can find you.", optional: true },
  { id: "preview", title: "Preview & publish", blurb: "Review your profile, then publish when you're ready." },
];

export default function Onboarding({ initial }: { initial: ProfileView }) {
  const router = useRouter();
  const [profile, setProfile] = useState(initial);
  const [step, setStep] = useState(Math.min(initial.profile.onboardingStep, STEPS.length - 1));
  const [publishError, setPublishError] = useState("");
  const [publishing, setPublishing] = useState(false);

  const current = STEPS[step];
  const published = profile.profile.status === "published";

  async function publish() {
    setPublishing(true);
    setPublishError("");
    const result = await postJson<{ status: string }>("/api/profile/publish", "POST", { published: true });
    setPublishing(false);
    if (!result.ok) return setPublishError(result.message);
    router.push("/dashboard?published=1");
    router.refresh();
  }

  const back = step > 0 ? (
    <button type="button" className="button button-secondary" onClick={() => setStep(step - 1)}>Back</button>
  ) : null;

  return (
    <div className="acct-onboarding">
      <header className="acct-onboarding__head">
        <p className="section-eyebrow">STEP {step + 1} OF {STEPS.length}</p>
        <h1>{current.title}</h1>
        <p>{current.blurb}</p>
        <div className="acct-steps" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={step + 1} aria-label="Onboarding progress">
          {STEPS.map((s, i) => (
            <button key={s.id} type="button" className={i === step ? "is-active" : i < step ? "is-done" : ""} onClick={() => setStep(i)} aria-label={`Go to ${s.title}`} aria-current={i === step ? "step" : undefined} />
          ))}
        </div>
      </header>

      {current.id === "preview" ? (
        <div>
          <div className="acct-preview" aria-label="Profile preview">
            <PublicProfileView
              profile={toDiraProfile(profile)}
              journeyItems={[]}
              isOwner={false}
              manageHref="#"
              hideJourney
              currentMoment={{ updated: "", moments: [] }}
            />
          </div>
          {profile.completion.missing.length ? (
            <p className="acct-hint">Still empty: {profile.completion.missing.join(", ")}. You can add these later from your dashboard.</p>
          ) : null}
          {publishError ? <p className="journey-error" role="alert">{publishError}</p> : null}
          <div className="journey-actions acct-actions">
            {back}
            <button type="button" className="button button-primary" onClick={publish} disabled={publishing}>
              {publishing ? "Publishing…" : published ? "Update & go to dashboard" : "Publish profile"}
            </button>
            <Link href="/dashboard" className="journey-link-button">Save as draft</Link>
          </div>
        </div>
      ) : (
        <SectionEditor
          key={`${current.id}-${step}`}
          section={current.id}
          profile={profile}
          step={step + 1}
          submitLabel="Save & continue"
          onSaved={(next) => {
            setProfile(next);
            setStep((s) => Math.min(s + 1, STEPS.length - 1));
            window.scrollTo({ top: 0 });
          }}
          secondary={
            <>
              {back}
              {current.optional ? (
                <button type="button" className="journey-link-button" onClick={() => setStep(step + 1)}>Skip for now</button>
              ) : null}
            </>
          }
        />
      )}
    </div>
  );
}
