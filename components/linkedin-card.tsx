import type { LinkedInProfile } from "@/lib/types";

export function LinkedInCard({ profile }: { profile: LinkedInProfile }) {
  const initial = profile.name.trim().charAt(0).toUpperCase() || "P";
  const photo = profile.photoUrl
    ? `/api/linkedin-photo?url=${encodeURIComponent(profile.photoUrl)}`
    : "";

  return (
    <section className="rounded-3xl border border-line bg-surface px-6 py-6">
      <h2 className="font-display text-2xl">LinkedIn</h2>
      <div className="mt-4 flex gap-4">
        {photo ? (
          // The photo is loaded through our own route after the public profile is read.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" className="size-20 shrink-0 rounded-full object-cover" />
        ) : (
          <div className="grid size-20 shrink-0 place-items-center rounded-full bg-accent-soft font-display text-3xl text-accent">
            {initial}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-xl">{profile.name || "LinkedIn profile"}</p>
          {profile.headline ? <p className="mt-1 leading-7">{profile.headline}</p> : null}
          {profile.location ? <p className="mt-1 text-sm text-muted">{profile.location}</p> : null}
        </div>
      </div>
      {profile.limited ? (
        <p className="mt-4 text-sm leading-6 text-muted">
          LinkedIn shared a short public preview. Fields that were not on the page are left blank.
        </p>
      ) : null}
      {profile.about ? <p className="mt-4 leading-7">{profile.about}</p> : null}
      {profile.experiences.length ? (
        <ul className="mt-4 flex flex-col gap-3">
          {profile.experiences.map((item) => (
            <li key={`${item.role}-${item.organization}`}>
              <p className="font-medium">{item.role || item.organization}</p>
              <p className="text-sm text-muted">
                {[item.role ? item.organization : "", item.time].filter(Boolean).join(" · ")}
              </p>
            </li>
          ))}
        </ul>
      ) : null}
      {profile.education.length ? (
        <ul className="mt-4 flex flex-col gap-2">
          {profile.education.map((item) => (
            <li key={item.school}>
              <p className="font-medium">{item.school}</p>
              {item.detail ? <p className="text-sm text-muted">{item.detail}</p> : null}
            </li>
          ))}
        </ul>
      ) : null}
      {profile.skills.length ? (
        <ul className="mt-4 flex flex-wrap gap-2">
          {profile.skills.map((skill) => (
            <li key={skill} className="rounded-full bg-background px-3 py-2 text-sm">
              {skill}
            </li>
          ))}
        </ul>
      ) : null}
      <a href={profile.url} target="_blank" rel="noreferrer" className="mt-4 inline-flex text-sm text-accent">
        Open the LinkedIn profile
      </a>
    </section>
  );
}
