"use client";

import { useState, type ReactNode } from "react";
import {
  CONTRIBUTION_TYPES, EMPLOYMENT_TYPES, EXPERTISE_CATEGORIES, LINK_PLATFORMS, RECOGNITION_KINDS,
  type ListSection, type MediaRef,
} from "../../lib/platform/types";
import { saveSection, type ProfileView } from "./api";
import ImageField from "./ImageField";

export type EditorSection = "identity" | "about" | ListSection;

type Errors = Record<string, string>;
type Row = Record<string, unknown> & { _key: string };

type Field = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "select" | "month" | "year" | "url" | "checkbox" | "image";
  options?: readonly string[];
  hint?: string;
  half?: boolean;
  hideWhen?: (row: Row) => boolean;
};

type ListConfig = {
  noun: string;
  fields: Field[];
  blank: () => Record<string, unknown>;
  title: (row: Row) => string;
  max?: number;
};

const label = (v: string) => (v === v.toLowerCase() ? v.charAt(0).toUpperCase() + v.slice(1).replace("-", " ") : v);

export const LIST_CONFIG: Record<ListSection, ListConfig> = {
  expertise: {
    noun: "expertise",
    fields: [
      { key: "name", label: "Name", half: true },
      { key: "category", label: "Type", type: "select", options: EXPERTISE_CATEGORIES, half: true },
    ],
    blank: () => ({ name: "", category: "expertise" }),
    title: (r) => String(r.name || "New expertise"),
  },
  experience: {
    noun: "role",
    fields: [
      { key: "title", label: "Job title", half: true },
      { key: "organization", label: "Organization", half: true },
      { key: "employmentType", label: "Employment type", type: "select", options: EMPLOYMENT_TYPES, half: true },
      { key: "location", label: "Location", half: true },
      { key: "startDate", label: "Start", type: "month", half: true },
      { key: "endDate", label: "End", type: "month", half: true, hideWhen: (r) => r.current === true },
      { key: "current", label: "I currently work here", type: "checkbox" },
      { key: "description", label: "Description", type: "textarea" },
    ],
    blank: () => ({ title: "", organization: "", employmentType: "Full-time", location: "", startDate: "", endDate: "", current: false, description: "" }),
    title: (r) => [r.title, r.organization].filter(Boolean).join(" · ") || "New role",
  },
  education: {
    noun: "education entry",
    fields: [
      { key: "institution", label: "Institution" },
      { key: "qualification", label: "Qualification", half: true },
      { key: "fieldOfStudy", label: "Field of study", half: true },
      { key: "startDate", label: "Start year", type: "year", half: true },
      { key: "endDate", label: "End year", type: "year", half: true },
      { key: "description", label: "Description", type: "textarea" },
    ],
    blank: () => ({ institution: "", qualification: "", fieldOfStudy: "", startDate: "", endDate: "", description: "" }),
    title: (r) => String(r.institution || "New education"),
  },
  recognition: {
    noun: "recognition",
    fields: [
      { key: "title", label: "Title", half: true },
      { key: "kind", label: "Type", type: "select", options: RECOGNITION_KINDS, half: true },
      { key: "issuer", label: "Issuer", half: true },
      { key: "issueDate", label: "Date", type: "month", half: true },
      { key: "credentialUrl", label: "Credential URL", type: "url" },
      { key: "description", label: "Description", type: "textarea" },
    ],
    blank: () => ({ title: "", kind: "certification", issuer: "", issueDate: "", credentialUrl: "", description: "" }),
    title: (r) => String(r.title || "New recognition"),
  },
  contributions: {
    noun: "contribution",
    fields: [
      { key: "title", label: "Title", half: true },
      { key: "type", label: "Type", type: "select", options: CONTRIBUTION_TYPES, half: true },
      { key: "description", label: "Description", type: "textarea" },
      { key: "url", label: "Link", type: "url" },
      { key: "media", label: "Image", type: "image", hint: "Optional. JPEG, PNG or WebP, up to 8 MB." },
    ],
    blank: () => ({ title: "", type: "project", description: "", url: "", media: null }),
    title: (r) => String(r.title || "New contribution"),
  },
  presence: {
    noun: "link",
    fields: [
      { key: "platform", label: "Platform", type: "select", options: LINK_PLATFORMS, half: true },
      { key: "label", label: "Label", half: true, hint: "Optional, e.g. your handle." },
      { key: "url", label: "URL", type: "url" },
    ],
    blank: () => ({ platform: "LinkedIn", label: "", url: "" }),
    title: (r) => String(r.label || r.platform || "New link"),
  },
};

const SOURCE: Record<ListSection, "expertise" | "experience" | "education" | "recognition" | "contributions" | "links"> = {
  expertise: "expertise", experience: "experience", education: "education",
  recognition: "recognition", contributions: "contributions", presence: "links",
};

let counter = 0;
const key = () => `row-${++counter}`;

type EditorProps = {
  section: EditorSection;
  profile: ProfileView;
  submitLabel?: string;
  step?: number;
  onSaved: (profile: ProfileView) => void;
  /** Extra controls rendered beside the submit button (e.g. Back / Skip). */
  secondary?: ReactNode;
};

export default function SectionEditor(props: EditorProps) {
  if (props.section === "identity") return <IdentityEditor {...props} />;
  if (props.section === "about") return <AboutEditor {...props} />;
  return <ListEditor {...props} section={props.section} />;
}

function useSave(props: EditorProps) {
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  async function save(data: unknown) {
    setBusy(true);
    setMessage(null);
    setErrors({});
    const result = await saveSection(props.section, data, props.step);
    setBusy(false);
    if (result.ok) {
      setMessage({ kind: "ok", text: "Saved." });
      props.onSaved(result.data.profile);
      return true;
    }
    setErrors(result.errors);
    setMessage({ kind: "error", text: Object.keys(result.errors).length ? "Please fix the highlighted fields." : result.message });
    return false;
  }
  return { busy, errors, message, save };
}

function Footer({ busy, message, label, secondary }: { busy: boolean; message: { kind: string; text: string } | null; label: string; secondary?: ReactNode }) {
  return (
    <div className="journey-actions acct-actions">
      {secondary}
      <button type="submit" className="button button-primary" disabled={busy}>{busy ? "Saving…" : label}</button>
      {message ? <p className={message.kind === "ok" ? "acct-saved" : "journey-error"} role="status">{message.text}</p> : null}
    </div>
  );
}

function IdentityEditor(props: EditorProps) {
  const p = props.profile.profile;
  const { busy, errors, message, save } = useSave(props);
  const [fullName, setFullName] = useState(p.fullName);
  const [headline, setHeadline] = useState(p.headline);
  const [username, setUsername] = useState(p.username);
  const [location, setLocation] = useState(p.location);
  const [profileImage, setProfileImage] = useState<MediaRef | null>(p.profileImage);
  const [coverImage, setCoverImage] = useState<MediaRef | null>(p.coverImage);

  return (
    <form className="acct-form" onSubmit={(e) => { e.preventDefault(); void save({ fullName, headline, username, location, profileImage, coverImage }); }}>
      <ImageField label="Profile photograph" hint="A clear head-and-shoulders photo works best." profileId={p.id} value={profileImage} onChange={setProfileImage} shape="round" />
      <ImageField label="Cover image" hint="Optional. Shown behind your portrait." profileId={p.id} value={coverImage} onChange={setCoverImage} />
      <TextField id="fullName" label="Full name" value={fullName} onChange={setFullName} error={errors.fullName} />
      <TextField id="headline" label="Professional headline" value={headline} onChange={setHeadline} error={errors.headline} hint="e.g. Cardiologist · Director of Clinical Research" />
      <TextField id="location" label="Location" value={location} onChange={setLocation} error={errors.location} />
      <TextField id="username" label="Profile address" value={username} onChange={(v) => setUsername(v.toLowerCase())} error={errors.username} hint={`dira.world/profile/${username || "your-name"}`} />
      <Footer busy={busy} message={message} label={props.submitLabel ?? "Save"} secondary={props.secondary} />
    </form>
  );
}

function AboutEditor(props: EditorProps) {
  const p = props.profile.profile;
  const { busy, errors, message, save } = useSave(props);
  const [biography, setBiography] = useState(p.biography);
  const [knownFor, setKnownFor] = useState(p.knownFor);
  const [careerFocus, setCareerFocus] = useState(p.careerFocus);
  const [interests, setInterests] = useState(p.interests.join(", "));

  return (
    <form className="acct-form" onSubmit={(e) => {
      e.preventDefault();
      void save({ biography, knownFor, careerFocus, interests: interests.split(",").map((s) => s.trim()).filter(Boolean) });
    }}>
      <TextField id="biography" label="Biography" textarea rows={7} value={biography} onChange={setBiography} error={errors.biography} hint={`${biography.length}/4000`} />
      <TextField id="knownFor" label="What are you known for?" value={knownFor} onChange={setKnownFor} error={errors.knownFor} />
      <TextField id="careerFocus" label="Career focus" value={careerFocus} onChange={setCareerFocus} error={errors.careerFocus} />
      <TextField id="interests" label="Professional interests" value={interests} onChange={setInterests} error={errors.interests} hint="Separate with commas." />
      <Footer busy={busy} message={message} label={props.submitLabel ?? "Save"} secondary={props.secondary} />
    </form>
  );
}

function ListEditor(props: EditorProps & { section: ListSection }) {
  const config = LIST_CONFIG[props.section];
  const source = props.profile[SOURCE[props.section]] as unknown as Record<string, unknown>[];
  const { busy, errors, message, save } = useSave(props);
  const [rows, setRows] = useState<Row[]>(() => source.map((item) => ({ ...item, _key: key() })));
  const profileId = props.profile.profile.id;
  const max = config.max ?? 40;

  const patch = (index: number, field: string, value: unknown) =>
    setRows((list) => list.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  const move = (index: number, by: -1 | 1) =>
    setRows((list) => {
      const next = [...list];
      const target = index + by;
      if (target < 0 || target >= next.length) return list;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  return (
    <form className="acct-form" onSubmit={(e) => {
      e.preventDefault();
      void save(rows.map((row) => {
        const rest: Record<string, unknown> = { ...row };
        delete rest._key;
        return rest;
      }));
    }}>
      {rows.length === 0 ? <p className="acct-empty">Nothing added yet. This section stays hidden on your profile until you add something.</p> : null}

      <ol className="acct-rows">
        {rows.map((row, index) => (
          <li key={row._key} className="acct-row">
            <div className="acct-row__head">
              <strong>{config.title(row)}</strong>
              <div className="acct-row__tools">
                <button type="button" className="journey-link-button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move up">↑</button>
                <button type="button" className="journey-link-button" onClick={() => move(index, 1)} disabled={index === rows.length - 1} aria-label="Move down">↓</button>
                <button type="button" className="journey-link-button" onClick={() => setRows((l) => l.filter((_, i) => i !== index))}>Remove</button>
              </div>
            </div>
            <div className="acct-grid">
              {config.fields.filter((f) => !f.hideWhen?.(row)).map((field) => {
                const id = `${props.section}-${row._key}-${field.key}`;
                const error = errors[`${index}.${field.key}`];
                const value = row[field.key];
                if (field.type === "image") {
                  return (
                    <div key={field.key} className="acct-grid__full">
                      <ImageField label={field.label} hint={field.hint} profileId={profileId} value={(value as MediaRef | null) ?? null} onChange={(m) => patch(index, field.key, m)} />
                      {error ? <p className="journey-error">{error}</p> : null}
                    </div>
                  );
                }
                if (field.type === "checkbox") {
                  return (
                    <label key={field.key} className="journey-check acct-grid__full">
                      <input type="checkbox" checked={value === true} onChange={(e) => patch(index, field.key, e.target.checked)} />
                      <span>{field.label}</span>
                    </label>
                  );
                }
                return (
                  <div key={field.key} className={field.half ? "" : "acct-grid__full"}>
                    <TextField
                      id={id} label={field.label} error={error} hint={field.hint}
                      value={String(value ?? "")} onChange={(v) => patch(index, field.key, v)}
                      textarea={field.type === "textarea"} rows={4}
                      select={field.type === "select" ? field.options : undefined}
                      inputType={field.type === "month" ? "month" : field.type === "url" ? "url" : field.type === "year" ? "number" : "text"}
                    />
                  </div>
                );
              })}
            </div>
          </li>
        ))}
      </ol>

      {errors.items ? <p className="journey-error">{errors.items}</p> : null}
      <button type="button" className="button button-secondary" onClick={() => setRows((l) => [...l, { ...config.blank(), _key: key() }])} disabled={rows.length >= max}>
        + Add {config.noun}
      </button>
      <Footer busy={busy} message={message} label={props.submitLabel ?? "Save"} secondary={props.secondary} />
    </form>
  );
}

function TextField({ id, label: text, value, onChange, error, hint, textarea, rows, select, inputType = "text" }: {
  id: string; label: string; value: string; onChange: (v: string) => void; error?: string; hint?: string;
  textarea?: boolean; rows?: number; select?: readonly string[]; inputType?: string;
}) {
  return (
    <div className="journey-field">
      <label htmlFor={id}>{text}</label>
      {select ? (
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
          {select.map((option) => <option key={option} value={option}>{label(option)}</option>)}
        </select>
      ) : textarea ? (
        <textarea id={id} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={Boolean(error)} />
      ) : (
        <input id={id} type={inputType} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={Boolean(error)}
          {...(inputType === "number" ? { min: 1900, max: 2100, inputMode: "numeric" as const } : {})} />
      )}
      {error ? <p className="journey-error">{error}</p> : hint ? <p className="acct-hint">{hint}</p> : null}
    </div>
  );
}
