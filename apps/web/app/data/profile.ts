export type DiraProfile = {
  username: string;
  name: string;
  headline: string;
  location: string;
  summary: string;

  expertise: string[];

  experience: {
    role: string;
    company: string;
    period: string;
    description: string;
  }[];

  projects: {
    name: string;
    description: string;
    tags: string[];
  }[];

  knowledge: {
    title: string;
    type: string;
    description: string;
  }[];

  evidence: {
    label: string;
    value: string;
  }[];

  socialLinks: {
    label: string;
    href: string;
  }[];
};

export const demoProfile: DiraProfile = {
  username: "alex-morgan",
  name: "Alex Morgan",
  headline: "AI & Cloud Platform Architect",
  location: "New York, USA",

  summary:
    "Building reliable cloud and AI platforms that help teams move from experimentation to production.",

  expertise: [
    "AI Infrastructure",
    "Cloud Architecture",
    "Platform Engineering",
    "Site Reliability",
    "Generative AI",
  ],

  experience: [
    {
      role: "Principal Platform Architect",
      company: "Northstar Technologies",
      period: "2022 — Present",
      description:
        "Leading cloud platform and AI infrastructure initiatives across engineering teams.",
    },
    {
      role: "Cloud Architect",
      company: "Vertex Systems",
      period: "2018 — 2022",
      description:
        "Designed scalable cloud platforms and developer infrastructure for enterprise workloads.",
    },
  ],

  projects: [
    {
      name: "AI Platform Foundation",
      description:
        "Designed a production platform for deploying, observing, and operating AI workloads.",
      tags: ["AI", "GCP", "Kubernetes"],
    },
    {
      name: "Developer Platform",
      description:
        "Built a self-service platform that improved engineering delivery and operational consistency.",
      tags: ["Platform", "DevOps", "SRE"],
    },
  ],

  knowledge: [
    {
      title: "Designing Reliable AI Platforms",
      type: "Article",
      description:
        "Lessons from building production infrastructure for modern AI workloads.",
    },
    {
      title: "From Cloud Infrastructure to AI Infrastructure",
      type: "Talk",
      description:
        "How platform engineering practices evolve for AI-driven systems.",
    },
  ],

  evidence: [
    {
      label: "Years experience",
      value: "15+",
    },
    {
      label: "Projects",
      value: "40+",
    },
    {
      label: "Publications",
      value: "12",
    },
    {
      label: "Talks",
      value: "8",
    },
  ],

  socialLinks: [
    {
      label: "LinkedIn",
      href: "#",
    },
    {
      label: "GitHub",
      href: "#",
    },
    {
      label: "YouTube",
      href: "#",
    },
  ],
};