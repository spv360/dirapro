export type SourceType = "self" | "external" | "verified-ready";

export type PublicPresenceCategory =
  | "social"
  | "professional"
  | "research";

export type ProfileIdentity = {
  name: string;
  headline: string;
  location: string;
  shortSummary: string;
  biographyPreview: string;
  biography: string;
  initials: string;
};

export type ExpertiseItem = {
  id: string;
  name: string;
  context?: string;
  featured?: boolean;
};

export type Appointment = {
  id: string;
  title: string;
  organization: string;
  organizationType: string;
  period: string;
  location?: string;
  summary: string;
  responsibilities: string[];
};

export type Achievement = {
  id: string;
  title: string;
  category: string;
  issuer: string;
  period: string;
  description?: string;
  image?: string;
  imageAlt?: string;
  sourceType?: SourceType;
};

export type Contribution = {
  id: string;
  title: string;
  contributionType: string;
  organization?: string;
  period?: string;
  summary: string;
  impact?: string;
  tags: string[];
  link?: string;
  image?: string;
  imageAlt?: string;
  sourceType?: SourceType;
};

export type KnowledgeItem = {
  id: string;
  title: string;
  format: string;
  venue: string;
  date: string;
  summary: string;
  link?: string;
  sourceType?: SourceType;
};

export type MediaItem = {
  id: string;
  title: string;
  format: string;
  outlet: string;
  date: string;
  summary: string;
  link?: string;
  sourceType?: SourceType;
};

export type PublicPresenceLink = {
  id: string;
  platform: string;
  label: string;
  url: string;
  category: PublicPresenceCategory;
  descriptor?: string;
  sourceType?: SourceType;
  featured?: boolean;
};

export type EvidenceSignal = {
  id: string;
  label: string;
  value: string;
  context?: string;
};

export type PublicMomentType =
  | "News"
  | "Event"
  | "Publication"
  | "Interview"
  | "Recognition"
  | "Announcement";

export type PublicMoment = {
  id: string;
  type: PublicMomentType;
  title: string;
  organization: string;
  date: string;
  summary?: string;
  link?: string;
  image?: string;
  imageAlt?: string;
};

export type CurrentMoment = {
  updated: string;
  moments: CurrentMomentItem[];
};

export type CurrentMomentItem = {
  mediaType: "image" | "video";
  type: string;
  title: string;
  date: string;
  image: string;
  imageAlt: string;
  organization?: string;
  summary: string;
  focus?: string[];
};

export type ConnectionConfig = {
  enabled: boolean;
  label: string;
};

export type DiraProfile = {
  username: string;
  identity: ProfileIdentity;
  expertise: ExpertiseItem[];
  appointments: Appointment[];
  achievements: Achievement[];
  contributions: Contribution[];
  knowledge: KnowledgeItem[];
  media: MediaItem[];
  publicPresence: PublicPresenceLink[];
  evidence: EvidenceSignal[];
  currentMoment: CurrentMoment;
  publicMoments: PublicMoment[];
  connection: ConnectionConfig;
};

export const demoProfile: DiraProfile = {
  username: "alex-morgan",
  identity: {
    name: "Alex Morgan",
    headline: "Professional identity strategist and AI infrastructure leader",
    location: "New York, United States",
    shortSummary:
      "Bringing together infrastructure, institutional leadership, and public knowledge to help organizations build reliable digital systems with human accountability.",
    biographyPreview:
      "A cross-disciplinary career spanning platform leadership, executive advisory, and public knowledge sharing.",
    biography:
      "Alex Morgan works across enterprise technology, executive advisory, and public knowledge sharing. Over the last sixteen years, Alex has led platform modernization programs, advised leadership teams on responsible AI adoption, built operating structures for large engineering organizations, and translated technical capability into decisions that executives, educators, and public institutions can trust. The result is a career defined not only by systems built, but by the professional judgment, stewardship, and evidence that support that work.",
    initials: "AM",
  },
  currentMoment: {
    updated: "August 2026",
    moments: [
      {
        mediaType: "image",
        type: "Speaking",
        title: "Future Technology Summit",
        date: "June 2026",
        image: "/profile/alex-speaking.webp",
        imageAlt: "Alex Morgan speaking at the Future Technology Summit.",
        organization: "Future Technology Summit",
        summary: "Speaking on building reliable AI systems for large organizations.",
        focus: ["AI Infrastructure", "Responsible AI"],
      },
      {
        mediaType: "image",
        type: "Building",
        title: "AI Platform Architecture",
        date: "May 2026",
        image: "/profile/alex-building.webp",
        imageAlt: "Alex Morgan working on an AI platform architecture.",
        organization: "Alex Morgan Studio",
        summary: "Shaping the architecture and operating model behind dependable enterprise AI.",
        focus: ["Platform Engineering", "Architecture"],
      },
      {
        mediaType: "image",
        type: "Project",
        title: "Enterprise AI Platform",
        date: "April 2026",
        image: "/profile/alex-platform.webp",
        imageAlt: "An enterprise AI platform project led by Alex Morgan.",
        organization: "Enterprise Platform Group",
        summary: "Turning responsible AI principles into an operating platform for large organizations.",
        focus: ["Enterprise AI", "Institutional Systems"],
      },
      {
        mediaType: "image",
        type: "Published",
        title: "AI / Technology Publication",
        date: "March 2026",
        image: "/profile/alex-publication.webp",
        imageAlt: "Alex Morgan contributing to an AI and technology publication.",
        organization: "MIT Sloan Management Review",
        summary: "A practical framework for moving AI from experimentation into accountable practice.",
        focus: ["Public Knowledge", "AI Governance"],
      },
    ],
  },

  publicMoments: [
    {
      id: "moment-ai-summit",
      type: "Event",
      title: "Future Technology Summit",
      organization: "Future Technology Summit",
      date: "June 2026",
      summary: "Speaking on building reliable AI systems for large organizations.",
    },
    {
      id: "moment-ai-article",
      type: "Publication",
      title: "Designing reliable AI operating models",
      organization: "MIT Sloan Management Review",
      date: "May 2026",
      summary:
        "A practical framework for moving AI from experimentation into accountable institutional practice.",
      link: "https://sloanreview.mit.edu/",
      image: "/profile/alex-publication.webp",
      imageAlt: "Alex Morgan contributing to a technology publication.",
    },
    {
      id: "moment-advisory",
      type: "Recognition",
      title: "Responsible AI Advisory Appointment",
      organization: "Digital Policy Forum",
      date: "April 2026",
      summary:
        "Joined a multidisciplinary working group focused on practical AI safeguards.",
    },
    {
      id: "moment-interview",
      type: "Interview",
      title: "The future of enterprise AI",
      organization: "Technology Leadership Review",
      date: "March 2026",
      summary:
        "Discussing how organizations can scale AI while maintaining operational accountability.",
    },
  ],

  connection: {
    enabled: true,
    label: "Connect with Alex",
  },
  expertise: [
    {
      id: "expertise-ai-governance",
      name: "AI Infrastructure Strategy",
      context:
        "Operating AI systems with reliability, observability, and accountability across large organizations.",
      featured: true,
    },
    {
      id: "expertise-platform",
      name: "Platform Architecture",
      context:
        "Designing internal platforms that help teams ship consistently and safely.",
      featured: true,
    },
    {
      id: "expertise-executive",
      name: "Executive Technology Advisory",
      context:
        "Helping boards and leadership teams make technology decisions grounded in operational reality.",
    },
    {
      id: "expertise-governance",
      name: "Responsible AI Governance",
      context:
        "Connecting policy, controls, and delivery practices for high-trust AI adoption.",
    },
    {
      id: "expertise-education",
      name: "Professional Education",
      context:
        "Lectures, workshops, and executive education on modern infrastructure and digital transformation.",
    },
  ],
  appointments: [
    {
      id: "appointment-northstar",
      title: "Principal Platform Architect",
      organization: "Northstar Technologies",
      organizationType: "Company",
      period: "2022 — Present",
      location: "New York, United States",
      summary:
        "Leading cross-functional platform and AI infrastructure strategy for a multi-business enterprise transformation program.",
      responsibilities: [
        "Directed cloud and AI operating models across engineering, compliance, and leadership stakeholders.",
        "Established architecture standards for production AI services and platform governance.",
        "Mentored platform leaders responsible for reliability, delivery, and developer enablement.",
      ],
    },
    {
      id: "appointment-vertex",
      title: "Cloud Architect",
      organization: "Vertex Systems",
      organizationType: "Company",
      period: "2018 — 2022",
      location: "Boston, United States",
      summary:
        "Designed enterprise cloud foundations that supported modernization, resilience, and regulated workloads.",
      responsibilities: [
        "Built reference architectures for scalable digital platforms serving multiple business units.",
        "Advised delivery teams on migration sequencing, resiliency patterns, and platform controls.",
      ],
    },
    {
      id: "appointment-columbia",
      title: "Guest Lecturer, Applied Systems Leadership",
      organization: "Columbia University",
      organizationType: "University",
      period: "2019 — Present",
      location: "New York, United States",
      summary:
        "Teaching practitioners and graduate learners how technical systems, governance, and institutional trust intersect.",
      responsibilities: [
        "Delivered lectures on platform operating models and responsible AI implementation.",
        "Supervised capstone work focused on production readiness and professional accountability.",
      ],
    },
  ],
  achievements: [
    {
      id: "achievement-forty-under-forty",
      title: "40 Under 40 in Enterprise Technology",
      category: "Recognition",
      issuer: "Tech Leadership Review",
      period: "2024",
      description:
        "Recognized for leading high-trust enterprise platform transformation programs.",
      image: "/profile/alex-achievement.webp",
      imageAlt: "Recognition for Alex Morgan's enterprise technology leadership.",
      sourceType: "external",
    },
    {
      id: "achievement-cloud-cert",
      title: "Professional Cloud Architect",
      category: "Certification",
      issuer: "Google Cloud",
      period: "2023",
      description:
        "Advanced certification covering architecture design, operations, and governance.",
      sourceType: "verified-ready",
    },
    {
      id: "achievement-board",
      title: "Advisory Appointment, Responsible AI Working Group",
      category: "Appointment",
      issuer: "Digital Policy Forum",
      period: "2022 — Present",
      description:
        "Serves on a multi-disciplinary advisory group exploring practical AI safeguards.",
      sourceType: "external",
    },
    {
      id: "achievement-milestone",
      title: "Led enterprise migration of 120+ services",
      category: "Milestone",
      issuer: "Northstar Technologies",
      period: "2023",
      description:
        "Migration program delivered reliability improvements and a clearer operating model for platform teams.",
      sourceType: "self",
    },
  ],
  contributions: [
    {
      id: "contribution-ai-foundation",
      title: "AI Platform Foundation",
      contributionType: "Technology platform",
      organization: "Northstar Technologies",
      period: "2022 — 2024",
      summary:
        "Created the operational foundation for deploying, monitoring, and governing production AI workloads across multiple business units.",
      impact:
        "Enabled faster model delivery while introducing stronger observability, review controls, and service ownership.",
      tags: ["AI operations", "Platform governance", "Enterprise delivery"],
      link: "https://www.northstar.com/insights/ai-governance",
      image: "/profile/alex-platform.webp",
      imageAlt: "Enterprise AI platform foundation led by Alex Morgan.",
      sourceType: "self",
    },
    {
      id: "contribution-executive-program",
      title: "Executive readiness program for responsible AI",
      contributionType: "Education program",
      organization: "Columbia University",
      period: "2021 — Present",
      summary:
        "Designed a professional education program that helps senior leaders understand AI capability, operating risk, and institutional responsibility.",
      impact:
        "Helped non-technical leaders make more grounded technology decisions.",
      tags: ["Executive education", "Responsible AI", "Leadership"],
      link: "https://professionalstudies.columbia.edu/",
      image: "/profile/alex-building.webp",
      imageAlt: "Alex Morgan building an executive responsible AI program.",
      sourceType: "external",
    },
    {
      id: "contribution-open-standards",
      title: "Operating standards for modern platform teams",
      contributionType: "Professional framework",
      organization: "Digital Policy Forum",
      period: "2020 — 2023",
      summary:
        "Contributed to a working framework for how platform teams document responsibility, resilience, and service stewardship.",
      impact:
        "Provided institutions with a language for discussing technical accountability beyond delivery speed alone.",
      tags: ["Governance", "Institutional trust", "Operations"],
      link: "https://www.weforum.org/agenda/archive/artificial-intelligence/",
      sourceType: "external",
    },
  ],
  knowledge: [
    {
      id: "knowledge-article",
      title: "Designing reliable AI operating models",
      format: "Article",
      venue: "MIT Sloan Management Review",
      date: "2025",
      summary:
        "A practical framework for moving AI work from experimentation into accountable institutional practice.",
      link: "https://sloanreview.mit.edu/",
      sourceType: "external",
    },
    {
      id: "knowledge-talk",
      title: "From cloud programs to AI institutions",
      format: "Conference talk",
      venue: "QCon New York",
      date: "2024",
      summary:
        "Explains how platform engineering, risk controls, and leadership habits evolve as AI becomes part of core operations.",
      link: "https://qconnewyork.com/",
      sourceType: "external",
    },
    {
      id: "knowledge-podcast",
      title: "Teaching executives to read technical risk",
      format: "Podcast",
      venue: "a16z Podcast",
      date: "2024",
      summary:
        "Conversation on translating architectural risk into executive language without losing technical truth.",
      link: "https://a16z.com/podcasts/",
      sourceType: "external",
    },
  ],
  media: [
    {
      id: "media-interview",
      title: "Why professional credibility needs more than a job title",
      format: "Interview",
      outlet: "Fast Company",
      date: "2025",
      summary:
        "Discusses how expertise becomes credible when it is connected to evidence, work, and public knowledge.",
      link: "https://www.fastcompany.com/",
      sourceType: "external",
    },
    {
      id: "media-panel",
      title: "Public infrastructure, AI, and institutional trust",
      format: "Conference panel",
      outlet: "World Economic Forum",
      date: "2024",
      summary:
        "Panel appearance on the operating obligations that come with high-impact digital systems.",
      link: "https://www.weforum.org/",
      sourceType: "external",
    },
    {
      id: "media-video",
      title: "A leadership brief on production AI",
      format: "Video",
      outlet: "YouTube",
      date: "2023",
      summary:
        "A concise public talk for leaders navigating the shift from proof-of-concept to accountable deployment.",
      link: "https://www.youtube.com/",
      sourceType: "self",
    },
  ],
  publicPresence: [
    {
      id: "presence-linkedin",
      platform: "LinkedIn",
      label: "Alex Morgan on LinkedIn",
      url: "https://www.linkedin.com/in/alex-morgan-identity/",
      category: "social",
      descriptor: "Updates, appointments, and speaking activity.",
      sourceType: "self",
      featured: true,
    },
    {
      id: "presence-x",
      platform: "X",
      label: "@alexmorgan",
      url: "https://x.com/alexmorgan",
      category: "social",
      descriptor: "Commentary on systems and responsible AI.",
      sourceType: "self",
    },
    {
      id: "presence-instagram",
      platform: "Instagram",
      label: "Alex Morgan",
      url: "https://www.instagram.com/alexmorgan/",
      category: "social",
      descriptor: "Talks, workshops, and events.",
      sourceType: "self",
    },
    {
      id: "presence-facebook",
      platform: "Facebook",
      label: "Alex Morgan",
      url: "https://www.facebook.com/alexmorgan",
      category: "social",
      descriptor: "Announcements and event notices.",
      sourceType: "self",
    },
    {
      id: "presence-youtube",
      platform: "YouTube",
      label: "Alex Morgan on YouTube",
      url: "https://www.youtube.com/@alexmorgan",
      category: "social",
      descriptor: "Talk recordings, lectures, and briefings.",
      sourceType: "self",
      featured: true,
    },
    {
      id: "presence-website",
      platform: "Personal website",
      label: "alexmorgan.co",
      url: "https://alexmorgan.co/",
      category: "professional",
      descriptor: "Official website for essays, advisory work, and public speaking.",
      sourceType: "self",
      featured: true,
    },
    {
      id: "presence-company",
      platform: "Company profile",
      label: "Northstar Technologies",
      url: "https://www.northstar.com/",
      category: "professional",
      descriptor: "Current enterprise platform leadership role.",
      sourceType: "external",
    },
    {
      id: "presence-university",
      platform: "University profile",
      label: "Columbia University professional studies",
      url: "https://professionalstudies.columbia.edu/",
      category: "professional",
      descriptor: "Teaching and executive education affiliation.",
      sourceType: "external",
    },
    {
      id: "presence-scholar",
      platform: "Google Scholar",
      label: "Scholar profile",
      url: "https://scholar.google.com/",
      category: "research",
      descriptor: "Research and publication discovery surface.",
      sourceType: "verified-ready",
    },
    {
      id: "presence-orcid",
      platform: "ORCID",
      label: "ORCID record",
      url: "https://orcid.org/",
      category: "research",
      descriptor: "Persistent professional research identity.",
      sourceType: "verified-ready",
    },
    {
      id: "presence-researchgate",
      platform: "ResearchGate",
      label: "ResearchGate",
      url: "https://www.researchgate.net/",
      category: "research",
      descriptor: "Research and publication network presence.",
      sourceType: "external",
    },
  ],
  evidence: [
    {
      id: "evidence-years",
      label: "Years of practice",
      value: "16+",
      context: "Across enterprise platforms, institutional advisory, and professional education.",
    },
    {
      id: "evidence-publications",
      label: "Publications and essays",
      value: "18",
      context: "Articles, essays, and published briefings on infrastructure and AI governance.",
    },
    {
      id: "evidence-talks",
      label: "Talks and lectures",
      value: "27",
      context: "Conference talks, guest lectures, and executive education sessions.",
    },
    {
      id: "evidence-initiatives",
      label: "Major initiatives led",
      value: "11",
      context: "Programs spanning platform modernization, AI operations, and governance design.",
    },
    {
      id: "evidence-awards",
      label: "Recognitions and appointments",
      value: "6",
      context: "Selected honors, certifications, and advisory appointments.",
    },
  ],
};