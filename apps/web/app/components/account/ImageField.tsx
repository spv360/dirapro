"use client";

import { useId, useRef, useState } from "react";
import { validateImageFile } from "../../lib/platform/validation";
import type { MediaRef } from "../../lib/platform/types";

type Props = {
  label: string;
  hint?: string;
  value: MediaRef | null;
  /** Serves the stored file back for preview. */
  profileId: string;
  onChange: (media: MediaRef | null) => void;
  shape?: "round" | "wide";
};

export default function ImageField({ label, hint, value, profileId, onChange, shape = "wide" }: Props) {
  const inputId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const src = localPreview ?? (value ? `/api/media/profile/${profileId}/${value.file}` : null);

  function upload(file: File) {
    const problem = validateImageFile(file);
    if (problem) {
      setError(problem);
      return;
    }
    setError("");
    const preview = URL.createObjectURL(file);
    setLocalPreview(preview);
    setProgress(0);

    const body = new FormData();
    body.append("file", file);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/profile/media");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onerror = () => {
      setProgress(null);
      setLocalPreview(null);
      URL.revokeObjectURL(preview);
      setError("Upload failed. Check your connection and try again.");
    };
    xhr.onload = () => {
      setProgress(null);
      let payload: { media?: MediaRef; error?: string } = {};
      try {
        payload = JSON.parse(xhr.responseText);
      } catch {
        /* non-JSON error body */
      }
      if (xhr.status === 201 && payload.media) {
        onChange(payload.media);
        // The stored file now backs the preview.
        setLocalPreview(null);
        URL.revokeObjectURL(preview);
      } else {
        setLocalPreview(null);
        URL.revokeObjectURL(preview);
        setError(payload.error ?? "Upload failed.");
      }
    };
    xhr.send(body);
  }

  const uploading = progress !== null;

  return (
    <div className="journey-field acct-image">
      <span className="acct-image__label" id={`${inputId}-label`}>{label}</span>
      <div className={`acct-image__frame acct-image__frame--${shape}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {src ? <img src={src} alt={`${label} preview`} /> : <span>No image</span>}
        {uploading ? (
          <div className="acct-image__progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-labelledby={`${inputId}-label`}>
            <span style={{ width: `${progress}%` }} />
          </div>
        ) : null}
      </div>
      <div className="acct-image__actions">
        <button type="button" className="button button-secondary" onClick={() => input.current?.click()} disabled={uploading}>
          {uploading ? `Uploading ${progress}%` : src ? "Replace" : "Upload"}
        </button>
        {src && !uploading ? (
          <button type="button" className="journey-link-button" onClick={() => { onChange(null); setLocalPreview(null); }}>
            Remove
          </button>
        ) : null}
      </div>
      <input
        ref={input}
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) upload(file);
        }}
      />
      {hint && !error ? <p className="acct-hint">{hint}</p> : null}
      {error ? <p className="journey-error" role="alert">{error}</p> : null}
    </div>
  );
}
