import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import SectionPage from "../../../components/account/SectionPage";
import type { EditorSection } from "../../../components/account/SectionEditors";
import { currentProfile } from "../../../lib/platform/session";
import { profileCompletion } from "../../../lib/platform/validation";
import { SECTION_LINKS } from "../../sections";

export const metadata = { title: "Edit profile · DiraPro", robots: { index: false } };

export default async function EditSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const meta = SECTION_LINKS.find((s) => s.id === section);
  if (!meta) notFound();

  const account = await currentProfile();
  if (!account) redirect("/login");

  return (
    <main className="profile-page acct-page">
      <nav className="profile-nav">
        <Link href="/" className="brand">Dira<span>Pro</span></Link>
        <Link href="/dashboard" className="profile-nav-back">← Dashboard</Link>
      </nav>
      <section className="acct-card acct-card--wide">
        <p className="section-eyebrow">EDIT PROFILE</p>
        <h1>{meta.title}</h1>
        <SectionPage section={meta.id as EditorSection} initial={{ ...account.aggregate, completion: profileCompletion(account.aggregate) }} />
      </section>
    </main>
  );
}
