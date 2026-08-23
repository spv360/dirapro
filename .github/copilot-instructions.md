# DiraPro Product & Engineering Instructions

## Product

DiraPro is a professional identity and knowledge platform.

DiraPro is NOT:
- LinkedIn
- a CV builder
- a portfolio-only website
- a social network
- an AI-generated personal website

DiraPro should become the canonical digital identity layer for professionals.

Primary users include:
- Doctors
- Lawyers
- Professors
- Researchers
- Bureaucrats
- Government administrators
- Business leaders
- Entrepreneurs
- Industrialists
- Consultants
- Artists
- Authors
- Coaches
- Public figures
- Technology professionals

The product must therefore work naturally for both technical and non-technical professionals.

---

## Product Principle

A Dira profile should answer:

1. Who is this person?
2. What are they known for?
3. What experience do they have?
4. What have they contributed?
5. What achievements or recognition do they have?
6. What knowledge do they share?
7. Where have they appeared publicly?
8. Where else can people find their official digital presence?

The profile should connect expertise with evidence.

Dira should communicate:

"Here is who I am, what I know, what I have done, what I contribute, and where my public professional presence exists."

---

## Professional Identity Model

The profile should support these conceptual areas:

### Identity
- Name
- Professional title/headline
- Photo
- Location
- Biography
- Short professional summary

### Expertise
- Areas of expertise
- Specializations
- Domains
- Skills or professional capabilities

### Career & Experience
- Roles
- Organizations
- Appointments
- Affiliations
- Periods
- Responsibilities/contributions

### Achievements & Recognition
- Awards
- Honors
- Certifications
- Appointments
- Major milestones
- Recognitions

### Contributions
This must be flexible because "work" differs by profession.

Examples:
- Doctor → clinical initiatives, healthcare programs
- Professor → research, academic programs
- Lawyer → notable practice areas, legal work
- Bureaucrat → public initiatives and administration programs
- Entrepreneur → companies, ventures, products
- Business leader → organizations, transformations
- Artist → works, exhibitions, performances
- Technology professional → projects and platforms

Do not hardcode "projects" as the only form of contribution.

### Knowledge
Support:
- Articles
- Books
- Research
- Publications
- Talks
- Lectures
- Presentations
- Podcasts
- Educational content

### Media & Public Appearances
Support:
- Interviews
- News articles
- Podcasts
- Videos
- Talks
- Conferences
- Public appearances

### Public Presence

Social and external professional presence is a first-class part of Dira.

Support links for:

Social:
- LinkedIn
- X / Twitter
- Instagram
- Facebook
- YouTube

Professional:
- Personal website
- Organization profile
- Hospital profile
- University profile
- Company profile
- Government profile

Research/knowledge:
- Google Scholar
- ORCID
- ResearchGate
- PubMed

The data model should be extensible so additional platforms can be added without changing the core architecture.

Links must be real external URLs and accessible through clear UI elements.

Do not assume every professional uses every platform.

---

## Trust

Dira should eventually distinguish between:

- self-declared information
- externally linked information
- verified information

Do NOT implement a complicated verification backend in this release.

However, design the data model so verification can be added later.

---

## Design Direction

Dira should feel:

- Premium
- Editorial
- Professional
- Trustworthy
- Modern
- Human
- Cinematic but restrained

The visual experience should feel closer to:

"professional dossier + editorial publication + modern digital identity"

and NOT:

- flashy developer portfolio
- generic SaaS dashboard
- LinkedIn clone
- crypto website
- excessive glassmorphism
- excessive gradients
- excessive neon
- AI cliché visuals

---

## Cinematic Motion

Use motion to enhance storytelling.

Good:
- subtle entrance choreography
- scroll reveals
- restrained parallax
- section transitions
- subtle hover movement
- timeline progression
- visual emphasis when evidence appears

Avoid:
- excessive animation
- distracting cursor effects
- heavy 3D
- autoplay video backgrounds
- animation everywhere

Motion must never reduce readability or accessibility.

Respect:

prefers-reduced-motion

---

## Profile Experience

The profile should evolve toward this structure:

1. Professional Identity
2. Areas of Expertise
3. Career & Experience
4. Achievements & Recognition
5. Contributions
6. Knowledge & Publications
7. Media & Appearances
8. Public Presence
9. Evidence / credibility signals

The exact visual treatment can evolve, but the hierarchy should remain understandable.

---

## Responsive Design

The experience must work well on:

- Desktop
- Tablet
- Mobile

Mobile is not an afterthought.

The profile should remain premium and readable around 390px width.

Avoid horizontal scrolling.

---

## Technical Architecture

Current stack:
- Next.js
- React
- TypeScript
- CSS
- App Router

Current profile route:

`/profile/[username]`

Current demo data:

`apps/web/app/data/profile.ts`

Do not introduce:
- database
- authentication
- CMS
- backend API
- unnecessary external services

for this release.

Keep the profile data-driven so backend integration can be introduced later.

---

## Component Architecture

Prefer reusable components.

Avoid putting the entire profile UI into one giant page.tsx.

Potential components include:

- ProfileHero
- ProfileIdentity
- ExpertiseSection
- ExperienceSection
- AchievementSection
- ContributionSection
- KnowledgeSection
- MediaSection
- PublicPresence
- EvidenceSection

Only create components where they provide real reuse or clarity.

Do not over-engineer.

---

## Existing Product

The existing Dira landing page is already established.

Do not unnecessarily rewrite or redesign the landing page while implementing the profile release.

Preserve its existing visual language.

The profile should feel like the same product.

---

## Data Model

The current demo profile is intentionally simple.

Evolve it carefully.

Prefer flexible domain models over profession-specific fields.

Do not create:

doctorExperience
lawyerExperience
professorExperience

etc.

Instead create general professional concepts that can represent all professions.

---

## Implementation Rules

Before making significant changes:

1. Inspect the existing repository.
2. Understand the current implementation.
3. Reuse existing components and design tokens where appropriate.
4. Avoid unnecessary dependencies.
5. Do not rewrite working functionality.
6. Keep changes within the approved scope.

After implementation:

- Run lint.
- Run TypeScript checks.
- Fix errors introduced by the implementation.
- Report files changed.
- Report architectural decisions.
- Report validation performed.

Do NOT commit.
Do NOT push.

The developer controls Git commits and PRs.

---

## Definition of Done

The release should feel like a meaningful evolution of DiraPro:

Dira is no longer merely displaying a professional profile.

It is presenting a complete professional identity:

identity + expertise + experience + contribution + knowledge + media + public presence + evidence.

The result must be credible enough that a doctor, professor, lawyer, bureaucrat or business leader would feel comfortable using it as their public professional identity.