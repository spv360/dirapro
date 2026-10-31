"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  JOURNEY_TYPES,
  MEDIA_ACCEPT,
  mediaUrl,
  validateJourneyInput,
  validateMediaFile,
  type JourneyItem,
  type JourneyMedia,
  type JourneyStatus,
} from "../../data/journey";
import JourneyEntry from "./JourneyEntry";

type FormState = {
  type: string;
  title: string;
  description: string;
  date: string;
  organization: string;
  tags: string;
  externalUrl: string;
  visibility: "public" | "private";
  featured: boolean;
  currentMoment: boolean;
  media: JourneyMedia | null;
};

const today = () => new Date().toISOString().slice(0, 10);

const blankForm = (): FormState => ({
  type: "Insight",
  title: "",
  description: "",
  date: today(),
  organization: "",
  tags: "",
  externalUrl: "",
  visibility: "public",
  featured: false,
  currentMoment: false,
  media: null,
});

const parseTags = (value: string) =>
  value.split(",").map((tag) => tag.trim()).filter(Boolean);

function toInput(item: JourneyItem, overrides: Partial<{ status: JourneyStatus; currentMoment: boolean; featured: boolean }> = {}) {
  return {
    type: item.type,
    title: item.title,
    description: item.description,
    date: item.date,
    media: item.media,
    tags: item.tags,
    organization: item.organization,
    externalUrl: item.externalUrl,
    visibility: item.visibility,
    status: overrides.status ?? item.status,
    featured: overrides.featured ?? item.featured,
    currentMoment: overrides.currentMoment ?? item.currentMomentReference !== null,
  };
}

function toForm(item: JourneyItem): FormState {
  return {
    type: item.type,
    title: item.title,
    description: item.description,
    date: item.date,
    organization: item.organization,
    tags: item.tags.join(", "),
    externalUrl: item.externalUrl,
    visibility: item.visibility,
    featured: item.featured,
    currentMoment: item.currentMomentReference !== null,
    media: item.media,
  };
}

async function errorMessage(response: Response) {
  const body = (await response.json().catch(() => null)) as { error?: string; errors?: Record<string, string> } | null;
  if (body?.errors) return Object.values(body.errors)[0];
  if (response.status === 401) return "Your session expired. Sign in again.";
  return body?.error ?? "Something went wrong.";
}

export default function JourneyStudio({
  username,
  initialItems,
}: {
  username: string;
  initialItems: JourneyItem[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [form, setForm] = useState<FormState>(blankForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [mediaError, setMediaError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => () => {
    if (localPreview) URL.revokeObjectURL(localPreview);
  }, [localPreview]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const mediaSrc = localPreview ?? (form.media ? mediaUrl(form.media) : null);
  const uploading = progress !== null;

  function replaceItem(item: JourneyItem) {
    setItems((current) => {
      const next = current.some((entry) => entry.id === item.id)
        ? current.map((entry) => (entry.id === item.id ? item : entry))
        : [...current, item];
      // The server enforces a single featured item; mirror that locally.
      return next
        .map((entry) => (item.featured && entry.id !== item.id ? { ...entry, featured: false } : entry))
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
    });
  }

  function reset() {
    setForm(blankForm());
    setEditingId(null);
    setLocalPreview(null);
    setErrors({});
    setMediaError("");
    setPreviewing(false);
  }

  function chooseFile(file: File | undefined) {
    if (!file) return;
    const problem = validateMediaFile(file);
    if (problem) {
      setMediaError(problem);
      return;
    }

    setMediaError("");
    setProgress(0);
    setLocalPreview(URL.createObjectURL(file));

    const data = new FormData();
    data.append("file", file);
    const request = new XMLHttpRequest();
    request.open("POST", "/api/journey/media");
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) setProgress(Math.round((event.loaded / event.total) * 100));
    };
    request.onload = () => {
      setProgress(null);
      let body: { media?: JourneyMedia; error?: string } = {};
      try {
        body = JSON.parse(request.responseText);
      } catch {}
      if (request.status === 201 && body.media) {
        const uploaded = body.media;
        setForm((current) => ({ ...current, media: uploaded, currentMoment: current.currentMoment && uploaded.kind === "image" }));
      } else {
        setLocalPreview(null);
        setMediaError(request.status === 401 ? "Your session expired. Sign in again." : (body.error ?? "Upload failed."));
      }
    };
    request.onerror = () => {
      setProgress(null);
      setLocalPreview(null);
      setMediaError("Upload failed. Check your connection and try again.");
    };
    request.send(data);
  }

  function removeMedia() {
    setLocalPreview(null);
    setMediaError("");
    setForm((current) => ({ ...current, media: null, currentMoment: false }));
  }

  const buildPayload = (status: JourneyStatus) => ({
    ...form,
    tags: parseTags(form.tags),
    status,
  });

  function openPreview() {
    const result = validateJourneyInput(buildPayload("draft"));
    setErrors(result.ok ? {} : result.errors);
    if (result.ok) setPreviewing(true);
  }

  async function save(status: JourneyStatus) {
    const result = validateJourneyInput(buildPayload(status));
    if (!result.ok) {
      setErrors(result.errors);
      setPreviewing(false);
      return;
    }

    setBusy(true);
    setNotice("");
    try {
      const response = await fetch(editingId ? `/api/journey/${editingId}` : "/api/journey", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.value),
      });
      if (!response.ok) {
        setNotice(await errorMessage(response));
        return;
      }
      const { item } = (await response.json()) as { item: JourneyItem };
      replaceItem(item);
      setNotice(status === "published" ? "Published. It now appears on your profile." : "Draft saved.");
      reset();
      router.refresh();
    } catch {
      setNotice("Network error. Nothing was saved.");
    } finally {
      setBusy(false);
    }
  }

  async function act(item: JourneyItem, overrides: Parameters<typeof toInput>[1], message: string) {
    setNotice("");
    const response = await fetch(`/api/journey/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toInput(item, overrides)),
    }).catch(() => null);
    if (!response?.ok) {
      setNotice(response ? await errorMessage(response) : "Network error.");
      return;
    }
    replaceItem(((await response.json()) as { item: JourneyItem }).item);
    setNotice(message);
    router.refresh();
  }

  async function remove(item: JourneyItem) {
    if (!window.confirm(`Delete “${item.title}” permanently?`)) return;
    const response = await fetch(`/api/journey/${item.id}`, { method: "DELETE" }).catch(() => null);
    if (!response?.ok) {
      setNotice(response ? await errorMessage(response) : "Network error.");
      return;
    }
    setItems((current) => current.filter((entry) => entry.id !== item.id));
    if (editingId === item.id) reset();
    setNotice("Update deleted.");
    router.refresh();
  }

  async function signOut() {
    await fetch("/api/owner/session", { method: "DELETE" });
    router.refresh();
  }

  const previewItem = {
    type: form.type,
    title: form.title.trim(),
    description: form.description.trim(),
    date: form.date,
    organization: form.organization.trim(),
    tags: parseTags(form.tags),
    externalUrl: form.externalUrl.trim(),
    media: form.media && mediaSrc ? { kind: form.media.kind, src: mediaSrc, alt: form.media.alt } : null,
  };

  return (
    <div className="journey-studio">
      <header className="journey-studio__header">
        <div>
          <p className="section-eyebrow">PROFESSIONAL JOURNEY</p>
          <h1>Share what you&apos;re working on.</h1>
        </div>
        <div className="journey-studio__session">
          <Link href={`/profile/${username}#journey`}>View public journey ↗</Link>
          <button type="button" onClick={signOut}>Sign out</button>
        </div>
      </header>

      {notice ? <p className="journey-notice" role="status">{notice}</p> : null}

      {previewing ? (
        <div className="journey-preview">
          <p className="section-eyebrow">PREVIEW — HOW VISITORS WILL SEE IT</p>
          <JourneyEntry item={previewItem} variant="featured" />
          <p className="journey-hint">
            {form.visibility === "private" ? "Visibility is private: only you will see this, even once published. " : ""}
            {form.currentMoment ? "It will also appear in Current Moment. " : ""}
          </p>
          <div className="journey-actions">
            <button className="button button-secondary" type="button" onClick={() => setPreviewing(false)}>Back to edit</button>
            <button className="button button-secondary" type="button" disabled={busy} onClick={() => save("draft")}>Save draft</button>
            <button className="button button-primary" type="button" disabled={busy || uploading} onClick={() => save("published")}>
              {busy ? "Publishing…" : "Publish"}
            </button>
          </div>
        </div>
      ) : (
        <form className="journey-form" onSubmit={(event) => { event.preventDefault(); openPreview(); }} noValidate>
          <p className="journey-form__mode">{editingId ? "Editing update" : "New update"}</p>

          <fieldset className="journey-field">
            <legend>Content type</legend>
            <div className="journey-types">
              {JOURNEY_TYPES.map((type) => (
                <label key={type} className={form.type === type ? "is-active" : ""}>
                  <input type="radio" name="type" value={type} checked={form.type === type} onChange={() => set("type", type)} />
                  {type}
                </label>
              ))}
            </div>
            {errors.type ? <span className="journey-error">{errors.type}</span> : null}
          </fieldset>

          <label className="journey-field">
            <span>Title</span>
            <input value={form.title} maxLength={140} onChange={(event) => set("title", event.target.value)} aria-invalid={!!errors.title} />
            {errors.title ? <span className="journey-error">{errors.title}</span> : null}
          </label>

          <label className="journey-field">
            <span>Description</span>
            <textarea rows={5} value={form.description} maxLength={2000} onChange={(event) => set("description", event.target.value)} />
            {errors.description ? <span className="journey-error">{errors.description}</span> : null}
          </label>

          <div className="journey-grid">
            <label className="journey-field">
              <span>Date</span>
              <input type="date" value={form.date} onChange={(event) => set("date", event.target.value)} />
              {errors.date ? <span className="journey-error">{errors.date}</span> : null}
            </label>
            <label className="journey-field">
              <span>Organization</span>
              <input value={form.organization} maxLength={120} onChange={(event) => set("organization", event.target.value)} />
            </label>
          </div>

          <div className="journey-field">
            <span>Image or video</span>
            {mediaSrc && form.media?.kind === "video" ? (
              <video className="journey-media-preview" src={mediaSrc} controls playsInline preload="metadata" />
            ) : null}
            {mediaSrc && form.media?.kind !== "video" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="journey-media-preview" src={mediaSrc} alt="Selected media preview" />
            ) : null}
            {uploading ? (
              <div className="journey-progress" role="progressbar" aria-valuenow={progress ?? 0} aria-valuemin={0} aria-valuemax={100}>
                <div style={{ width: `${progress}%` }} />
                <span>Uploading {progress}%</span>
              </div>
            ) : null}
            <div className="journey-actions journey-actions--start">
              <label className="button button-secondary journey-file">
                {form.media ? "Replace file" : "Choose file"}
                <input
                  type="file"
                  accept={MEDIA_ACCEPT}
                  disabled={uploading}
                  onChange={(event) => {
                    chooseFile(event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />
              </label>
              {form.media && !uploading ? (
                <button className="journey-link-button" type="button" onClick={removeMedia}>Remove</button>
              ) : null}
            </div>
            <small>JPEG, PNG or WebP up to 8 MB · MP4 or WebM up to 60 MB</small>
            {mediaError ? <span className="journey-error" role="alert">{mediaError}</span> : null}
            {errors.media ? <span className="journey-error">{errors.media}</span> : null}
          </div>

          <div className="journey-grid">
            <label className="journey-field">
              <span>Tags <small>comma separated</small></span>
              <input value={form.tags} onChange={(event) => set("tags", event.target.value)} placeholder="AI governance, Healthcare" />
              {errors.tags ? <span className="journey-error">{errors.tags}</span> : null}
            </label>
            <label className="journey-field">
              <span>External URL</span>
              <input type="url" inputMode="url" value={form.externalUrl} onChange={(event) => set("externalUrl", event.target.value)} placeholder="https://" />
              {errors.externalUrl ? <span className="journey-error">{errors.externalUrl}</span> : null}
            </label>
          </div>

          <div className="journey-grid">
            <label className="journey-field">
              <span>Visibility</span>
              <select value={form.visibility} onChange={(event) => set("visibility", event.target.value as FormState["visibility"])}>
                <option value="public">Public — visible on my profile</option>
                <option value="private">Private — only me</option>
              </select>
            </label>

            <div className="journey-field">
              <span>Placement</span>
              <label className="journey-check">
                <input type="checkbox" checked={form.featured} onChange={(event) => set("featured", event.target.checked)} />
                Feature at the top of my journey
              </label>
              <label className="journey-check">
                <input
                  type="checkbox"
                  checked={form.currentMoment}
                  disabled={form.media?.kind !== "image"}
                  onChange={(event) => set("currentMoment", event.target.checked)}
                />
                Feature as Current Moment
              </label>
              <small>Current Moment needs an image.</small>
              {errors.currentMoment ? <span className="journey-error">{errors.currentMoment}</span> : null}
            </div>
          </div>

          <div className="journey-actions">
            {editingId ? <button className="journey-link-button" type="button" onClick={reset}>Cancel editing</button> : null}
            <button className="button button-secondary" type="button" disabled={busy || uploading} onClick={() => save("draft")}>Save draft</button>
            <button className="button button-primary" type="submit" disabled={uploading}>Preview</button>
          </div>
        </form>
      )}

      <section className="journey-manage" aria-label="Your updates">
        <p className="section-eyebrow">YOUR UPDATES</p>
        {!items.length ? <p className="journey-hint">Nothing yet. Your drafts and published updates will be listed here.</p> : null}
        <ul>
          {items.map((item) => (
            <li key={item.id}>
              <div>
                <div className="journey-manage__meta">
                  <span className={`journey-status journey-status--${item.status}`}>{item.status}</span>
                  <span>{item.type}</span>
                  <span>{item.visibility}</span>
                  {item.featured ? <span>featured</span> : null}
                  {item.currentMomentReference ? <span>current moment</span> : null}
                </div>
                <strong>{item.title}</strong>
              </div>
              <div className="journey-manage__actions">
                <button type="button" onClick={() => { setForm(toForm(item)); setEditingId(item.id); setLocalPreview(null); setPreviewing(false); setErrors({}); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Edit</button>
                {item.status === "published" ? (
                  <button type="button" onClick={() => act(item, { status: "draft" }, "Moved back to drafts.")}>Unpublish</button>
                ) : (
                  <button type="button" onClick={() => act(item, { status: "published" }, "Published.")}>Publish</button>
                )}
                {item.status === "archived" ? null : (
                  <button type="button" onClick={() => act(item, { status: "archived" }, "Archived.")}>Archive</button>
                )}
                {item.media?.kind === "image" ? (
                  <button type="button" onClick={() => act(item, { currentMoment: !item.currentMomentReference }, item.currentMomentReference ? "Removed from Current Moment." : "Featured as Current Moment.")}>
                    {item.currentMomentReference ? "Unfeature moment" : "Feature as Current Moment"}
                  </button>
                ) : null}
                <button type="button" className="is-danger" onClick={() => remove(item)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
