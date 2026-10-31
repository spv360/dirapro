"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ProfileView } from "./api";
import SectionEditor, { type EditorSection } from "./SectionEditors";

export default function SectionPage({ section, initial }: { section: EditorSection; initial: ProfileView }) {
  const router = useRouter();
  const [profile, setProfile] = useState(initial);
  return (
    <SectionEditor
      section={section}
      profile={profile}
      onSaved={(next) => {
        setProfile(next);
        router.refresh();
      }}
    />
  );
}
