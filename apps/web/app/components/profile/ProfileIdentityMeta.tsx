type ProfileIdentityMetaProps = {
  location: string;
  shortSummary: string;
  biographyPreview: string;
};

export default function ProfileIdentityMeta({
  location,
  shortSummary,
  biographyPreview,
}: ProfileIdentityMetaProps) {
  return (
    <div className="profile-identity-meta">
      <p className="profile-location">{location}</p>
      <p className="profile-summary">{shortSummary}</p>
      <p className="profile-biography-preview">{biographyPreview}</p>
    </div>
  );
}